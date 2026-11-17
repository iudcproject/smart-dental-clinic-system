const db = require('../config/db');

// ضمان وجود الأعمدة الإضافية في جدول المواعيد مرة واحدة عند تحميل الخدمة
const extraColumns = [
  'ALTER TABLE appointments ADD COLUMN custom_service_name TEXT',
  'ALTER TABLE appointments ADD COLUMN visit_completed INTEGER DEFAULT 0',
  'ALTER TABLE appointments ADD COLUMN procedure_done INTEGER DEFAULT 0',
  'ALTER TABLE appointments ADD COLUMN visits_count INTEGER DEFAULT 1'
];
extraColumns.forEach((sql) => { try { db.prepare(sql).run(); } catch (e) {} });

function createHttpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// 1. التحقق من شروط الحجز وإنشاء الموعد مع إشعار الطبيب
function createAppointment(user, payload) {
  const { doctor_id, service_id, date, start_time, notes, patient_id } = payload;
  const isStaff = user.role === 'doctor' || user.role === 'admin';
  const targetDoctorId = user.role === 'doctor' && !doctor_id ? user.id : doctor_id;

  if (!targetDoctorId || !date || !start_time) {
    throw createHttpError(400, 'الطبيب والتاريخ والساعة مطلوبة');
  }
  if (start_time < '09:00' || start_time > '20:00') {
    throw createHttpError(400, 'عذراً، وقت الحجز خارج ساعات العمل الرسمية للعيادة (09:00 ص - 08:00 م)');
  }

  const now = new Date();
  const [year, month, day] = date.split('-').map(Number);
  const [h, m] = start_time.split(':').map(Number);
  const appointmentDateTime = new Date(year, month - 1, day, h, m, 0, 0);

  if (!isStaff) {
    const minHoursRow = db.prepare("SELECT setting_value FROM clinic_settings WHERE setting_key = 'min_booking_hours'").get();
    const minHours = minHoursRow ? Number(minHoursRow.setting_value) : 3;

    if ((appointmentDateTime - now) / (1000 * 60 * 60) < minHours) {
      throw createHttpError(400, `عذراً، يجب أن يتم حجز الموعد قبل ${minHours} ساعات على الأقل من وقت الزيارة`);
    }
  }

  const conflictAppt = db.prepare(`
    SELECT id FROM appointments 
    WHERE doctor_id = ? AND date = ? AND start_time = ? AND status != 'cancelled'
  `).get(targetDoctorId, date, start_time);

  if (conflictAppt) {
    throw createHttpError(400, 'عذراً، الطبيب لديه موعد محجوز مسبقاً في هذا التوقيت، يرجى اختيار وقت آخر');
  }

  let calculatedEndTime = start_time;
  if (service_id) {
    const service = db.prepare('SELECT duration FROM dental_services WHERE id = ?').get(service_id);
    if (service && service.duration) {
      const totalMinutes = h * 60 + m + service.duration;
      const endH = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
      const endM = (totalMinutes % 60).toString().padStart(2, '0');
      calculatedEndTime = `${endH}:${endM}`;
    }
  }

  const targetPatientId = user.role === 'patient' ? user.id : patient_id;
  if (!targetPatientId) throw createHttpError(400, 'يرجى اختيار المريض المطلوب');

  const initialStatus = isStaff ? 'confirmed' : 'pending';

  const insertTransaction = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO appointments (doctor_id, patient_id, service_id, date, start_time, end_time, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(targetDoctorId, targetPatientId, service_id || null, date, start_time, calculatedEndTime, initialStatus, notes || '');

    if (isStaff) {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message)
        VALUES (?, ?, ?)
      `).run(targetPatientId, 'تم حجز وتأكيد موعد جديد لك', `تم تحديد موعد مؤكد لك في العيادة بتاريخ ${date} الساعة ${start_time}`);
    } else {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message)
        VALUES (?, ?, ?)
      `).run(targetDoctorId, 'موعد جديد بانتظار التأكيد', `قام المريض بحجز موعد جديد بتاريخ ${date} الساعة ${start_time}`);
    }

    return info.lastInsertRowid;
  });

  const newId = insertTransaction();
  return db.prepare(`
    SELECT a.*, p.name as patient_name, p.phone as patient_phone,
           d.name as doctor_name, d.specialty as doctor_specialty,
           COALESCE(a.custom_service_name, s.name) as service_name, s.price as service_price
    FROM appointments a
    JOIN users p ON a.patient_id = p.id
    JOIN users d ON a.doctor_id = d.id
    LEFT JOIN dental_services s ON a.service_id = s.id
    WHERE a.id = ?
  `).get(newId);
}

// 2. توثيق إتمام الزيارة وتوليد السجل الطبي وإشعار المريض في معاملة موحدة
function completeVisitAndCreateRecord(appointmentId, payload) {
  const { visit_completed, procedure_done, visits_count, tooth_number, diagnosis, treatment, cost, notes } = payload;

  const appt = db.prepare(`
    SELECT a.*, COALESCE(a.custom_service_name, s.name, 'استشارة وعلاج') AS final_service_name,
           COALESCE(s.price, 0) AS default_price
    FROM appointments a
    LEFT JOIN dental_services s ON a.service_id = s.id
    WHERE a.id = ?
  `).get(appointmentId);

  if (!appt) throw createHttpError(404, 'الموعد غير موجود');

  const isCompleted = visit_completed ? 1 : 0;
  const isProcedureDone = procedure_done ? 1 : 0;
  const vCount = Math.max(1, Number(visits_count) || 1);
  const newStatus = isCompleted ? 'completed' : appt.status;

  const executeWorkflow = db.transaction(() => {
    db.prepare(`
      UPDATE appointments 
      SET status = ?, visit_completed = ?, procedure_done = ?, visits_count = ?
      WHERE id = ?
    `).run(newStatus, isCompleted, isProcedureDone, vCount, appointmentId);

    if (isCompleted) {
      const finalCost = (cost !== undefined && cost !== '') ? Number(cost) : Number(appt.default_price || 0);
      const finalTreatment = treatment || appt.final_service_name;
      const finalDiagnosis = diagnosis || `متابعة موعد (${appt.final_service_name}) - عدد الزيارات: ${vCount}`;
      const finalNotes = `${notes || ''} [عدد الزيارات المحتاجة: ${vCount} | تم الإجراء: ${isProcedureDone ? 'نعم' : 'لا'}]`.trim();

      db.prepare(`
        INSERT INTO dental_records (patient_id, doctor_id, tooth_number, diagnosis, treatment, cost, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(appt.patient_id, appt.doctor_id, tooth_number || 'عام', finalDiagnosis, finalTreatment, finalCost, finalNotes);

      db.prepare(`
        INSERT INTO notifications (user_id, title, message)
        VALUES (?, ?, ?)
      `).run(
        appt.patient_id,
        'تم توثيق زيارتك وإضافة السجل الطبي',
        `تم تسجيل إتمام زيارتك بتاريخ ${appt.date} (${finalTreatment}) بتكلفة ${finalCost} دينار.`
      );
    }
  });

  executeWorkflow();
  return isCompleted
    ? 'تم توثيق الزيارة وإنشاء السجل الطبي وترحيله للتقارير المالية بنجاح'
    : 'تم حفظ حالة متابعة الموعد';
}

// 3. تحديد أو تخصيص خدمة الموعد وإرسال إشعار للمريض
function assignAppointmentService(appointmentId, { service_id, custom_service_name }) {
  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointmentId);
  if (!appt) throw createHttpError(404, 'الموعد غير موجود');

  let finalServiceName = custom_service_name;

  if (custom_service_name) {
    db.prepare('UPDATE appointments SET service_id = NULL, custom_service_name = ? WHERE id = ?')
      .run(custom_service_name, appointmentId);
  } else {
    db.prepare('UPDATE appointments SET service_id = ?, custom_service_name = NULL WHERE id = ?')
      .run(service_id, appointmentId);
    const srv = db.prepare('SELECT name FROM dental_services WHERE id = ?').get(service_id);
    finalServiceName = srv ? srv.name : 'خدمة علاجية محددة';
  }

  db.prepare(`
    INSERT INTO notifications (user_id, title, message)
    VALUES (?, ?, ?)
  `).run(
    appt.patient_id,
    'تم تحديد خدمة موعدك',
    `تم اعتماد الخدمة (${finalServiceName}) لموعدك المقرر بتاريخ ${appt.date} الساعة ${appt.start_time}`
  );
}

// 4. أتمتة إتمام الزيارة وتنزيل السجل الطبي للمريض تلقائياً من بيانات الموعد السابقة
function autoCompleteAppointmentAndCreateRecord(appointmentId) {
  const appt = db.prepare(`
    SELECT a.*, COALESCE(a.custom_service_name, s.name, 'كشف وعلاج أسنان') AS final_service_name,
           COALESCE(s.price, 0) AS default_price
    FROM appointments a
    LEFT JOIN dental_services s ON a.service_id = s.id
    WHERE a.id = ?
  `).get(appointmentId);

  if (!appt) throw createHttpError(404, 'الموعد غير موجود');

  const runAutomation = db.transaction(() => {
    db.prepare(`
      UPDATE appointments 
      SET status = 'completed', visit_completed = 1, procedure_done = 1, visits_count = COALESCE(visits_count, 1)
      WHERE id = ?
    `).run(appointmentId);

    // منع تكرار السجل الطبي إذا تم إتمام الموعد مسبقاً
    if (Number(appt.visit_completed) !== 1) {
      const autoDiagnosis = appt.notes && appt.notes.trim()
        ? appt.notes.trim()
        : `إتمام جلسة علاجية: ${appt.final_service_name}`;
      const autoNotes = `تم توليد السجل تلقائياً عند حضور المريض وإتمام الموعد بتاريخ ${appt.date}`;

      db.prepare(`
        INSERT INTO dental_records (patient_id, doctor_id, tooth_number, diagnosis, treatment, cost, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        appt.patient_id,
        appt.doctor_id,
        'عام',
        autoDiagnosis,
        appt.final_service_name,
        Number(appt.default_price || 0),
        autoNotes
      );

      db.prepare(`
        INSERT INTO notifications (user_id, title, message)
        VALUES (?, ?, ?)
      `).run(
        appt.patient_id,
        'تم إتمام زيارتك وإضافة السجل الطبي',
        `تم تسجيل إتمام زيارتك (${appt.final_service_name}) بتاريخ ${appt.date} وإضافة السجل الطبي في ملفك تلقائياً.`
      );
    }
  });

  runAutomation();
}

module.exports = {
  createAppointment,
  completeVisitAndCreateRecord,
  assignAppointmentService,
  autoCompleteAppointmentAndCreateRecord
};