const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../config/db');
const { sendVerificationEmail } = require('../config/mailer');

// محدد محاولات تسجيل الدخول لمنع هجمات التخمين (10 محاولات كل 15 دقيقة لكل IP)
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 10;
const LOCK_WINDOW_MS = 15 * 60 * 1000;

function loginRateLimiter(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record && now - record.firstAttempt < LOCK_WINDOW_MS) {
    if (record.count >= MAX_LOGIN_ATTEMPTS) {
      return res.status(429).json({
        error: 'تم تجاوز الحد المسموح لمحاولات تسجيل الدخول. يرجى المحاولة بعد 15 دقيقة.'
      });
    }
    record.count += 1;
  } else {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  }
  next();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// دالة موحدة لتسجيل مريض جديد
async function handleRegistration(req, res) {
  try {
    const name = String(req.body.name || req.body.fullName || '').trim();
    const email = String(req.body.email || req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const phone = String(req.body.phone || '').trim();

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'الاسم، البريد الإلكتروني، وكلمة المرور مطلوبة' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'صيغة البريد الإلكتروني غير صحيحة' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'البريد الإلكتروني مستخدم مسبقاً' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const result = db.prepare(`
      INSERT INTO users (name, email, password, phone, role, is_verified, verification_token)
      VALUES (?, ?, ?, ?, 'patient', 0, ?)
    `).run(name, email, hashedPassword, phone, verificationToken);

    const newUser = db
      .prepare('SELECT id, name, email, role, phone, is_verified FROM users WHERE id = ?')
      .get(result.lastInsertRowid);

    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: 'تعذر تهيئة جلسة المستخدم' });
      }
      req.session.user = newUser;

      // إرسال بريد التفعيل دون إسقاط الطلب في حال تعذر اتصال SMTP
      sendVerificationEmail(email, name, verificationToken).catch((mailErr) => {
        console.error('[Mailer Warning] Failed to send verification email:', mailErr.message);
      });

      res.status(201).json({
        message: 'تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.',
        user: newUser
      });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

router.post('/register', handleRegistration);

// تأكيد البريد الإلكتروني عبر الرابط
router.get('/verify', (req, res) => {
  try {
    const token = String(req.query.token || '').trim();
    if (!token) {
      return res.status(400).send('<div dir="rtl" style="font-family: Arial, sans-serif; text-align: center; padding: 60px;"><h3 style="color:#dc2626;">رابط التحقق غير صالح أو مفقود.</h3></div>');
    }

    const user = db.prepare('SELECT id FROM users WHERE verification_token = ?').get(token);
    if (!user) {
      return res.status(400).send('<div dir="rtl" style="font-family: Arial, sans-serif; text-align: center; padding: 60px;"><h3 style="color:#dc2626;">رمز التحقق غير صحيح أو انتهت صلاحيته.</h3></div>');
    }

    db.prepare('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?').run(user.id);

    res.send(`
      <div dir="rtl" style="font-family: Arial, sans-serif; text-align: center; padding: 60px; background: #f8faff; min-height: 100vh;">
        <div style="background: #ffffff; padding: 40px; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #16a34a; margin-bottom: 15px;">تم تأكيد بريدك الإلكتروني بنجاح</h2>
          <p style="color: #334155; font-size: 16px; margin-bottom: 25px;">شكراً لك، يمكنك الآن استخدام حسابك في العيادة والاستفادة من كافة الخدمات.</p>
          <a href="/login.html" style="display: inline-block; background: #1e3a5f; color: #ffffff; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">الذهاب إلى صفحة تسجيل الدخول</a>
        </div>
      </div>
    `);
  } catch (e) {
    res.status(500).send('حدث خطأ في الخادم أثناء تأكيد البريد الإلكتروني');
  }
});

// تسجيل الدخول
router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبة' });
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(email);
    if (!user) {
      return res.status(400).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    loginAttempts.delete(ip);

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      specialty: user.specialty,
      phone: user.phone,
      is_verified: user.is_verified
    };

    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: 'تعذر إنشاء جلسة تسجيل الدخول' });
      }
      req.session.user = sessionUser;
      res.json({ message: 'تم تسجيل الدخول بنجاح', user: sessionUser });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// التحقق من المستخدم الحالي للجلسة
router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ user: req.session.user });
  }
  res.status(401).json({ error: 'غير مسجل الدخول' });
});

// تسجيل الخروج
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'تعذر تسجيل الخروج' });
    }
    res.clearCookie('clinic.sid');
    res.clearCookie('connect.sid');
    res.json({ message: 'تم تسجيل الخروج بنجاح' });
  });
});

module.exports = router;
module.exports.handleRegistration = handleRegistration;