const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// جلب بيانات الملف الشخصي للمستخدم الحالي
router.get('/', isAuthenticated, (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, name, email, role, specialty, phone, is_verified, created_at FROM users WHERE id = ?'
    ).get(req.session.user.id);
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// تحديث الملف الشخصي وكلمة المرور
router.put('/', isAuthenticated, async (req, res) => {
  try {
    const { name, email, phone, specialty, current_password, new_password } = req.body;
    const userId = req.session.user.id;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const updatedName = name ? name.trim() : user.name;
    const updatedEmail = email ? email.trim() : user.email;
    const updatedPhone = phone !== undefined ? phone : user.phone;
    const updatedSpecialty = specialty !== undefined ? specialty : user.specialty;

    if (updatedEmail !== user.email) {
      const emailTaken = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(updatedEmail, userId);
      if (emailTaken) {
        return res.status(400).json({ error: 'البريد الإلكتروني مستخدم لحساب آخر' });
      }
    }

    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ error: 'كلمة المرور الحالية مطلوبة لتغيير كلمة المرور' });
      }
      const match = await bcrypt.compare(current_password, user.password);
      if (!match) {
        return res.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة' });
      }
      if (new_password.length < 6) {
        return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
      }
      const hashed = await bcrypt.hash(new_password, 10);
      db.prepare('UPDATE users SET name=?, email=?, phone=?, specialty=?, password=? WHERE id=?')
        .run(updatedName, updatedEmail, updatedPhone, updatedSpecialty, hashed, userId);
    } else {
      db.prepare('UPDATE users SET name=?, email=?, phone=?, specialty=? WHERE id=?')
        .run(updatedName, updatedEmail, updatedPhone, updatedSpecialty, userId);
    }

    const updated = db.prepare('SELECT id, name, email, role, specialty, phone, is_verified FROM users WHERE id = ?').get(userId);
    req.session.user = updated;

    res.json({ message: 'تم تحديث البيانات بنجاح', user: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;