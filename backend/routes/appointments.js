const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated, isAdmin, isDoctorOrAdmin } = require('../middleware/auth');
const visitService = require('../services/visitService');

const BASE_APPOINTMENT_QUERY = `
  SELECT a.*, 
         p.name as patient_name, p.phone as patient_phone,
         d.name as doctor_name, d.specialty as doctor_specialty,
         COALESCE(a.custom_service_name, s.name) as service_name,
         s.price as service_price, s.duration as service_duration
  FROM appointments a
  JOIN users p ON a.patient_id = p.id
  JOIN users d ON a.doctor_id = d.id
  LEFT JOIN dental_services s ON a.service_id = s.id
`;

// جلب مواعيد المستخدم الحالي حسب دوره
router.get('/my', isAuthenticated, (req, res) => {
  try {
    const user = req.session.user;
    if (user.role === 'patient') {
      const appointments = db
        .prepare(`${BASE_APPOINTMENT_QUERY} WHERE a.patient_id = ? ORDER BY a.date DESC, a.start_time ASC`)
        .all(user.id);
      return res.json({ appointments });
    }
    if (user.role === 'doctor') {
      const appointments = db
        .prepare(`${BASE_APPOINTMENT_QUERY} WHERE a.doctor_id = ? ORDER BY a.date DESC, a.start_time ASC`)
        .all(user.id);
      return res.json({ appointments });
    }
    const appointments = db
      .prepare(`${BASE_APPOINTMENT_QUERY} ORDER BY a.date DESC, a.start_time ASC`)
      .all();
    res.json({ appointments });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// جلب جميع المواعيد (مقيد بالطبيب والأدمن لحماية خصوصية المرضى)
router.get('/', isDoctorOrAdmin, (req, res) => {
  try {
    const user = req.session.user;
    if (user.role === 'doctor') {
      const appointments = db
        .prepare(`${BASE_APPOINTMENT_QUERY} WHERE a.doctor_id = ? ORDER BY a.date DESC, a.start_time ASC`)
        .all(user.id);
      return res.json({ appointments });
    }
    const appointments = db
      .prepare(`${BASE_APPOINTMENT_QUERY} ORDER BY a.date DESC, a.start_time ASC`)
      .all();
    res.json({ appointments });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// إنشاء موعد جديد
router.post('/', isAuthenticated, (req, res) => {
  try {
    const appointment = visitService.createAppointment(req.session.user, req.body);
    const isStaff = req.session.user.role === 'doctor' || req.session.user.role === 'admin';
    res.status(201).json({
      message: isStaff
        ? 'تم حجز الموعد وتأكيده مباشرة بنجاح'
        : 'تم حجز الموعد بنجاح وهو قيد انتظار موافقة الطبيب',
      appointment
    });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// تحديث حالة الموعد مع التحقق الصارم من الصلاحيات وإرسال الإشعارات
router.patch('/:id/status', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.session.user;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'حالة الموعد غير صالحة' });
    }

    const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    if (!appt) return res.status(404).json({ error: 'الموعد غير موجود' });

    // التحقق من الصلاحية: المريض يملك فقط إلغاء موعده الخاص
    if (user.role === 'patient') {
      if (appt.patient_id !== user.id) {
        return res.status(403).json({ error: 'غير مصرح لك بتعديل هذا الموعد' });
      }
      if (status !== 'cancelled') {
        return res.status(403).json({ error: 'يمكن للمريض طلب إلغاء الموعد فقط' });
      }
      if (appt.status === 'completed') {
        return res.status(400).json({ error: 'لا يمكن إلغاء موعد مكتمل بالفعل' });
      }
    } else if (user.role === 'doctor' && appt.doctor_id !== user.id) {
      return res.status(403).json({ error: 'هذا الموعد مسجل لدى طبيب آخر' });
    }

    if (status === 'completed') {
      visitService.autoCompleteAppointmentAndCreateRecord(id);
      return res.json({ message: 'تم تأكيد حضور المريض وإتمام الزيارة وتنزيل السجل الطبي تلقائياً' });
    }

    db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, id);

    // إرسال إشعار للطرف المعني
    if (user.role === 'patient' && status === 'cancelled') {
      db.prepare('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)').run(
        appt.doctor_id,
        'إلغاء موعد من قبل المريض',
        `قام المريض ${user.name} بإلغاء موعده المقرر بتاريخ ${appt.date} الساعة ${appt.start_time}`
      );
    } else if (status === 'confirmed' || status === 'cancelled') {
      const title = status === 'confirmed' ? 'تأكيد الموعد' : 'إلغاء الموعد';
      const msg =
        status === 'confirmed'
          ? `تم تأكيد موعدك المقرر بتاريخ ${appt.date} الساعة ${appt.start_time}`
          : `عذراً، تم إلغاء موعدك المقرر بتاريخ ${appt.date}`;
      db.prepare('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)').run(
        appt.patient_id,
        title,
        msg
      );
    }

    res.json({ message: 'تم تحديث حالة الموعد وإرسال الإشعار بنجاح' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// توثيق إتمام الزيارة وتوليد السجل الطبي (للطبيب والأدمن)
router.post('/:id/complete-visit', isDoctorOrAdmin, (req, res) => {
  try {
    const message = visitService.completeVisitAndCreateRecord(req.params.id, req.body);
    res.json({ message });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// تحديد أو تخصيص خدمة الموعد (للطبيب والأدمن)
router.patch('/:id/service', isDoctorOrAdmin, (req, res) => {
  try {
    visitService.assignAppointmentService(req.params.id, req.body);
    res.json({ message: 'تم اعتماد وتحديث الخدمة للمريض بنجاح' });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// تحديث ملاحظات الموعد (مع التحقق من الملكية)
router.patch('/:id/notes', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;
    const appt = db.prepare('SELECT patient_id, doctor_id FROM appointments WHERE id = ?').get(id);
    if (!appt) return res.status(404).json({ error: 'الموعد غير موجود' });

    const isOwner =
      user.role === 'admin' ||
      (user.role === 'doctor' && appt.doctor_id === user.id) ||
      (user.role === 'patient' && appt.patient_id === user.id);

    if (!isOwner) {
      return res.status(403).json({ error: 'غير مصرح لك بتعديل ملاحظات هذا الموعد' });
    }

    const cleanNotes = String(req.body.notes || '').trim().slice(0, 1000);
    db.prepare('UPDATE appointments SET notes = ? WHERE id = ?').run(cleanNotes, id);
    res.json({ message: 'تم تحديث الملاحظات بنجاح' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// حذف موعد (للأدمن فقط)
router.delete('/:id', isAdmin, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'الموعد غير موجود' });
    }
    res.json({ message: 'تم حذف الموعد بنجاح' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;