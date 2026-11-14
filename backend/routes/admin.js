const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { isAdmin } = require('../middleware/auth');

// جلب جميع الأطباء
router.get('/doctors', isAdmin, (req, res) => {
  try {
    const doctors = db.prepare("SELECT id, name, email, phone, specialty, created_at FROM users WHERE role = 'doctor' ORDER BY id DESC").all();
    res.json({ doctors });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// إضافة طبيب جديد بواسطة الأدمن
router.post('/doctors', isAdmin, async (req, res) => {
  try {
    const { name, email, password, specialty, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'الاسم والبريد وكلمة المرور مطلوبة' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'البريد الإلكتروني مستخدم مسبقاً' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const info = db.prepare(`
      INSERT INTO users (name, email, password, role, specialty, phone, is_verified)
      VALUES (?, ?, ?, 'doctor', ?, ?, 1)
    `).run(name, email, hashedPassword, specialty || 'أخصائي طب وجراحة الفم والأسنان', phone || '');

    const newDoc = db.prepare('SELECT id, name, email, phone, specialty, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ message: 'تمت إضافة الطبيب بنجاح', doctor: newDoc });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// حذف طبيب
router.delete('/doctors/:id', isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM users WHERE id = ? AND role = 'doctor'").run(id);
    res.json({ message: 'تم حذف الطبيب بنجاح' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// إحصائيات عامة للأدمن
router.get('/stats', isAdmin, (req, res) => {
  try {
    const doctorsCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'doctor'").get().count;
    const patientsCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'patient'").get().count;
    const apptsCount = db.prepare('SELECT COUNT(*) as count FROM appointments').get().count;
    const servicesCount = db.prepare('SELECT COUNT(*) as count FROM dental_services').get().count;
    res.json({ stats: { doctorsCount, patientsCount, apptsCount, servicesCount } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;