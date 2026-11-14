const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated, isDoctorOrAdmin } = require('../middleware/auth');

// جلب سجلات الأسنان لمريض معين
router.get('/records/:patientId', isAuthenticated, (req, res) => {
  try {
    const { patientId } = req.params;
    const user = req.session.user;

    // المريض يرى سجلاته الخاصة فقط
    if (user.role === 'patient' && String(user.id) !== String(patientId)) {
      return res.status(403).json({ error: 'غير مصرح لك بالاطلاع على سجلات مريض آخر' });
    }

    const records = db.prepare(`
      SELECT dr.*, u.name as doctor_name 
      FROM dental_records dr
      JOIN users u ON dr.doctor_id = u.id
      WHERE dr.patient_id = ?
      ORDER BY dr.created_at DESC
    `).all(patientId);

    res.json({ records });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// إضافة سجل سن/علاج جديد لمريض (للطبيب والأدمن فقط)
router.post('/records', isDoctorOrAdmin, (req, res) => {
  try {
    const user = req.session.user;
    const { patient_id, tooth_number, diagnosis, treatment, cost, notes } = req.body;

    if (!patient_id || !tooth_number || !diagnosis || !treatment) {
      return res.status(400).json({ error: 'جميع الحقول الأساسية مطلوبة (المريض، رقم السن، التشخيص، العلاج)' });
    }

    const info = db.prepare(`
      INSERT INTO dental_records (patient_id, doctor_id, tooth_number, diagnosis, treatment, cost, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(patient_id, user.id, tooth_number, diagnosis, treatment, Number(cost) || 0, notes || '');

    const newRecord = db.prepare('SELECT * FROM dental_records WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ message: 'تمت إضافة السجل الطبي بنجاح', record: newRecord });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// حذف سجل سن/علاج (للطبيب والأدمن فقط)
router.delete('/records/:id', isDoctorOrAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM dental_records WHERE id = ?').run(id);
    res.json({ message: 'تم حذف السجل بنجاح' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;