const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// جلب مواعيد المستخدم الحالي حسب دوره (مريض، طبيب، أو أدمن)
router.get('/my', isAuthenticated, (req, res) => {
  try {
    const user = req.session.user;
    let query = `
      SELECT a.*, 
             p.name as patient_name, p.phone as patient_phone,
             d.name as doctor_name, d.specialty as doctor_specialty,
             s.name as service_name, s.price as service_price, s.duration as service_duration
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      LEFT JOIN services s ON a.service_id = s.id
    `;

    if (user.role === 'patient') {
      query += ' WHERE a.patient_id = ? ORDER BY a.date DESC, a.start_time ASC';
      const appointments = db.prepare(query).all(user.id);
      return res.json({ appointments });
    }

    if (user.role === 'doctor') {
      query += ' WHERE a.doctor_id = ? ORDER BY a.date DESC, a.start_time ASC';
      const appointments = db.prepare(query).all(user.id);
      return res.json({ appointments });
    }

    query += ' ORDER BY a.date DESC, a.start_time ASC';
    const appointments = db.prepare(query).all();
    res.json({ appointments });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// جلب جميع المواعيد
router.get('/', isAuthenticated, (req, res) => {
  try {
    const appointments = db.prepare(`
      SELECT a.*, 
             p.name as patient_name, p.phone as patient_phone,
             d.name as doctor_name, d.specialty as doctor_specialty,
             s.name as service_name, s.price as service_price, s.duration as service_duration
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      LEFT JOIN services s ON a.service_id = s.id
      ORDER BY a.date DESC, a.start_time ASC
    `).all();
    res.json({ appointments });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// إنشاء موعد جديد مع التحقق من الشروط، حساب وقت النهاية، وإرسال الإشعار
router.post('/', isAuthenticated, (req, res) => {
  try {
    const user = req.session.user;
    const { doctor_id, service_id, date, start_time, notes, patient_id } = req.body;

    if (!doctor_id || !date || !start_time) {
      return res.status(400).json({ error: 'الطبيب والتاريخ والساعة مطلوبة' });
    }

    // 1. التحقق من ساعات العمل الرسمية (بين 09:00 صباحاً و 08:00 مساءً)
    if (start_time < '09:00' || start_time > '20:00') {
      return res.status(400).json({ error: 'عذراً، وقت الحجز خارج ساعات العمل الرسمية للعيادة (09:00 ص - 08:00 م)' });
    }

    // 2. التحقق من شرط الحد الأدنى للساعات
    const now = new Date();
    const [year, month, day] = date.split('-').map(Number);
    const [h, m] = start_time.split(':').map(Number);
    const appointmentDateTime = new Date(year, month - 1, day, h, m, 0, 0);

    const minHoursRow = db.prepare("SELECT setting_value FROM clinic_settings WHERE setting_key = 'min_booking_hours'").get();
    const minHours = minHoursRow ? Number(minHoursRow.setting_value) : 3;

    const diffHours = (appointmentDateTime - now) / (1000 * 60 * 60);
    if (diffHours < minHours) {
      return res.status(400).json({ error: `عذراً، يجب أن يتم حجز الموعد قبل ${minHours} ساعات على الأقل من وقت الزيارة` });
    }

    // 3. منع التضارب
    const conflictAppt = db.prepare(`
      SELECT id FROM appointments 
      WHERE doctor_id = ? AND date = ? AND start_time = ? AND status != 'cancelled'
    `).get(doctor_id, date, start_time);

    if (conflictAppt) {
      return res.status(400).json({ error: 'عذراً، الطبيب لديه موعد محجوز مسبقاً في هذا التوقيت، يرجى اختيار وقت آخر' });
    }

    // 4. حساب وقت النهاية (end_time) تلقائياً بناءً على مدة الخدمة
    let calculatedEndTime = start_time;
    if (service_id) {
      const service = db.prepare('SELECT duration FROM services WHERE id = ?').get(service_id);
      if (service && service.duration) {
        const totalMinutes = h * 60 + m + service.duration;
        const endH = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
        const endM = (totalMinutes % 60).toString().padStart(2, '0');
        calculatedEndTime = `${endH}:${endM}`;
      }
    }

    const targetPatientId = (user.role === 'patient') ? user.id : patient_id;
    if (!targetPatientId) {
      return res.status(400).json({ error: 'المريض مطلوب' });
    }

    // 5. إدخال الموعد في قاعدة البيانات
    const info = db.prepare(`
      INSERT INTO appointments (doctor_id, patient_id, service_id, date, start_time, end_time, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(doctor_id, targetPatientId, service_id || null, date, start_time, calculatedEndTime, notes || '');

    // 6. إرسال إشعار تلقائي للطبيب
    db.prepare(`
      INSERT INTO notifications (user_id, title, message)
      VALUES (?, ?, ?)
    `).run(doctor_id, 'موعد جديد بانتظار التأكيد', `قام المريض بحجز موعد جديد بتاريخ ${date} الساعة ${start_time}`);

    // 7. جلب تفاصيل الموعد المُنشأ
    const newAppt = db.prepare(`
      SELECT a.*, 
             p.name as patient_name, p.phone as patient_phone,
             d.name as doctor_name, d.specialty as doctor_specialty,
             s.name as service_name, s.price as service_price
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.id = ?
    `).get(info.lastInsertRowid);

    res.status(201).json({ message: 'تم حجز الموعد بنجاح وهو قيد انتظار موافقة الطبيب', appointment: newAppt });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// تحديث حالة الموعد (مع إرسال إشعار للمريض عند التأكيد أو الإلغاء)
router.patch('/:id/status', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'حالة الموعد غير صالحة' });
    }

    // جلب معلومات الموعد لإرسال الإشعار للمريض
    const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    if (!appt) return res.status(404).json({ error: 'الموعد غير موجود' });

    db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, id);

    // إرسال إشعار للمريض عند تغيير الحالة
    if (status === 'confirmed' || status === 'cancelled') {
      const title = status === 'confirmed' ? 'تأكيد الموعد' : 'إلغاء الموعد';
      const msg = status === 'confirmed' 
        ? `تم تأكيد موعدك المقرر بتاريخ ${appt.date} الساعة ${appt.start_time}` 
        : `عذراً، تم إلغاء موعدك المقرر بتاريخ ${appt.date}`;
      
      db.prepare(`
        INSERT INTO notifications (user_id, title, message)
        VALUES (?, ?, ?)
      `).run(appt.patient_id, title, msg);
    }

    res.json({ message: 'تم تحديث حالة الموعد وإرسال الإشعار بنجاح' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// تحديث ملاحظات الموعد
router.patch('/:id/notes', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    db.prepare('UPDATE appointments SET notes = ? WHERE id = ?').run(notes || '', id);
    res.json({ message: 'تم تحديث الملاحظات بنجاح' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// حذف موعد
router.delete('/:id', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM appointments WHERE id = ?').run(id);
    res.json({ message: 'تم حذف الموعد بنجاح' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;