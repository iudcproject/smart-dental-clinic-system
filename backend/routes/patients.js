const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { isDoctorOrAdmin } = require('../middleware/auth');
const { handleRegistration } = require('./auth');

// مسار التسجيل الذاتي للمريض (/api/patients/register) يستدعي الدالة الموحدة من auth.js
router.post('/register', handleRegistration);

// جلب كافة المرضى مع إحصائيات المواعيد والسجلات الطبية (للطبيب والأدمن فقط)
router.get('/', isDoctorOrAdmin, (req, res) => {
  try {
    const patients = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.is_verified, u.created_at,
             (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = u.id) AS appointments_count,
             (SELECT COUNT(*) FROM dental_records dr WHERE dr.patient_id = u.id) AS records_count
      FROM users u
      WHERE u.role = 'patient'
      ORDER BY u.id DESC
    `).all();
    res.json({ patients });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// إضافة مريض مباشرة من لوحة التحكم (للطبيب والأدمن)
router.post('/', isDoctorOrAdmin, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !name.trim() || !email || !email.trim() || !password) {
      return res.status(400).json({ error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'البريد الإلكتروني مستخدم مسبقاً' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const info = db.prepare(`
      INSERT INTO users (name, email, password, phone, role, is_verified)
      VALUES (?, ?, ?, ?, 'patient', 1)
    `).run(name.trim(), cleanEmail, hashedPassword, (phone || '').trim());

    const newPatient = db.prepare('SELECT id, name, email, phone, is_verified, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);
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

    const updatedName = (name && name.trim()) ? name.trim() : user.name;
    const updatedEmail = (email && email.trim()) ? email.trim().toLowerCase() : user.email;
    const updatedPhone = phone !== undefined ? String(phone).trim() : user.phone;

    const emailConflict = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(updatedEmail, id);
    if (emailConflict) {
      return res.status(400).json({ error: 'البريد الإلكتروني مستخدم لحساب آخر بالفعل' });
    }

    if (password && password.trim() !== '') {
      if (password.trim().length < 6) {
        return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
      }
      const hashedPass = await bcrypt.hash(password.trim(), 10);
      db.prepare('UPDATE users SET name = ?, email = ?, phone = ?, password = ? WHERE id = ?')
        .run(updatedName, updatedEmail, updatedPhone, hashedPass, id);
    } else {
      db.prepare('UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?')
        .run(updatedName, updatedEmail, updatedPhone, id);
    }

    const updatedPatient = db.prepare('SELECT id, name, email, phone, is_verified, created_at FROM users WHERE id = ?').get(id);
    res.json({ message: 'تم تعديل بيانات المريض بنجاح', patient: updatedPatient });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// حذف مريض (يحذف مواعيده وسجلاته المرتبطة تلقائياً عبر ON DELETE CASCADE)
router.delete('/:id', isDoctorOrAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare("DELETE FROM users WHERE id = ? AND role = 'patient'").run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'المريض غير موجود' });
    }
    res.json({ message: 'تم حذف المريض وجميع مواعيده وسجلاته المرتبطة بنجاح' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;