const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../config/db');
const { sendVerificationEmail } = require('../config/mailer');

// دالة موحدة لتسجيل مريض جديد (تخدم مساري /auth/register و /patients/register)
async function handleRegistration(req, res) {
  try {
    const name = req.body.name || req.body.fullName;
    const email = req.body.email || req.body.username;
    const password = req.body.password;
    const phone = req.body.phone || '';

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'الاسم، البريد الإلكتروني، وكلمة المرور مطلوبة' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'البريد الإلكتروني مستخدم مسبقاً' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    db.prepare(`
      INSERT INTO users (name, email, password, phone, role, is_verified, verification_token)
      VALUES (?, ?, ?, ?, 'patient', 0, ?)
    `).run(name, email, hashedPassword, phone, verificationToken);

    const newUser = db.prepare('SELECT id, name, email, role, phone, is_verified FROM users WHERE email = ?').get(email);
    req.session.user = newUser;

    await sendVerificationEmail(email, name, verificationToken);

    res.status(201).json({
      message: 'تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.',
      user: newUser
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

router.post('/register', handleRegistration);

// تأكيد البريد الإلكتروني عبر الرابط
router.get('/verify', (req, res) => {
  try {
    const { token } = req.query;
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
          <a href="/" style="display: inline-block; background: #1e3a5f; color: #ffffff; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">الذهاب إلى صفحة تسجيل الدخول</a>
        </div>
      </div>
    `);
  } catch (e) {
    res.status(500).send('حدث خطأ في الخادم أثناء تأكيد البريد الإلكتروني');
  }
});

// تسجيل الدخول
router.post('/login', async (req, res) => {
  try {
    const email = req.body.email || req.body.username;
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبة' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(400).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      specialty: user.specialty,
      phone: user.phone,
      is_verified: user.is_verified
    };

    res.json({ message: 'تم تسجيل الدخول بنجاح', user: req.session.user });
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
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'تعذر تسجيل الخروج' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'تم تسجيل الخروج بنجاح' });
  });
});

module.exports = router;
module.exports.handleRegistration = handleRegistration;