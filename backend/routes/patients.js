const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { isDoctorOrAdmin } = require('../middleware/auth');
const { handleRegistration } = require('./auth');

// مسار التسجيل الذاتي للمريض (/api/patients/register) يستدعي الدالة الموحدة من auth.js
router.post('/register', handleRegistration);

// جلب كافة المرضى (للطبيب والأدمن فقط)
router.get('/', isDoctorOrAdmin, (req, res) => {
  try {
    const patients = db.prepare("SELECT id, name, email, phone, is_verified, created_at FROM users WHERE role = 'patient' ORDER BY id DESC").all();
    res.json({ patients });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// إضافة مريض مباشرة من لوحة التحكم (للطبيب والأدمن)
router.post('/', isDoctorOrAdmin, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'الاسم والبريد وكلمة المرور مطلوبة' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'البريد الإلكتروني مستخدم مسبقاً' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const info = db.prepare(`
      INSERT INTO users (name, email, password, phone, role, is_verified)
      VALUES (?, ?, ?, ?, 'patient', 1)
    `).run(name, email, hashedPassword, phone || '');

    const newPatient = db.prepare('SELECT id, name, email, phone, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ message: 'تمت إضافة المريض بنجاح', patient: newPatient });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// تعديل بيانات مريض
router.put('/:id', isDoctorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password } = req.body;

    const user = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'patient'").get(id);
    if (!user) {
      return res.status(404).json({ error: 'المريض غير موجود' });
    }

    const updatedName = name || user.name;
    const updatedEmail = email !== undefined ? email : user.email;
    const updatedPhone = phone !== undefined ? phone : user.phone;

    if (password && password.trim() !== '') {
      const hashedPass = await bcrypt.hash(password, 10);
      db.prepare('UPDATE users SET name = ?, email = ?, phone = ?, password = ? WHERE id = ?')
        .run(updatedName, updatedEmail, updatedPhone, hashedPass, id);
    } else {
      db.prepare('UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?')
        .run(updatedName, updatedEmail, updatedPhone, id);
    }

    const updatedPatient = db.prepare('SELECT id, name, email, phone, created_at FROM users WHERE id = ?').get(id);
    res.json({ message: 'تم تعديل بيانات المريض بنجاح', patient: updatedPatient });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// حذف مريض
router.delete('/:id', isDoctorOrAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM users WHERE id = ? AND role = 'patient'").run(id);
    res.json({ message: 'تم حذف المريض بنجاح' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;