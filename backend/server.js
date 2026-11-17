const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const session = require('express-session');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. الإعدادات الأساسية
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'clinic-fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

// 2. استيراد وتفعيل مسارات الـ API (يجب أن تكون دائماً في الأعلى)
const authRouter = require('./routes/auth');
const servicesRouter = require('./routes/services');
const adminRouter = require('./routes/admin');
const appointmentsRouter = require('./routes/appointments');
const patientsRouter = require('./routes/patients');
const dentalRouter = require('./routes/dental');
const profileRouter = require('./routes/profile');
const aiRouter = require('./routes/ai');
const settingsRouter = require('./routes/settings');
const notificationsRouter = require('./routes/notifications');

app.use('/api/auth', authRouter);
app.use('/api/services', servicesRouter);
app.use('/api/admin', adminRouter);
// إضافة عمود الخدمة المخصصة تلقائياً لجدول المواعيد إن لم يكن موجوداً
try { db.prepare("ALTER TABLE appointments ADD COLUMN custom_service_name TEXT").run(); } catch (e) {}

// مسار تحديد أو تخصيص الخدمة للموعد (صلاحية الأدمن والطبيب)
app.patch('/api/appointments/:id/service', (req, res) => {
  const user = req.session?.user;
  if (!user || user.role === 'patient') {
    return res.status(403).json({ error: 'غير مصرح للمريض بتعديل نوع الخدمة' });
  }
  const { id } = req.params;
  const { service_id, custom_service_name } = req.body;

  try {
    if (custom_service_name) {
      db.prepare("UPDATE appointments SET service_id = NULL, custom_service_name = ? WHERE id = ?")
        .run(custom_service_name, id);
    } else {
      db.prepare("UPDATE appointments SET service_id = ?, custom_service_name = NULL WHERE id = ?")
        .run(service_id, id);
    }
    res.json({ message: 'تم تحديث الخدمة بنجاح' });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في تحديث الخدمة' });
  }
});
app.use('/api/appointments', appointmentsRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/dental', dentalRouter);
app.use('/api/profile', profileRouter);
app.use('/api/ai', aiRouter);
// مسار استبدال الفيديو الخلفي للصفحة الرئيسية (للأدمن فقط وبشرط الاسم dental-bg.mp4)
app.post('/api/settings/upload-video', express.raw({ type: 'video/mp4', limit: '100mb' }), (req, res) => {
  const user = req.session?.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح لك بتغيير الفيديو' });
  }
  const fileName = req.headers['x-file-name'];
  if (fileName !== 'dental-bg.mp4') {
    return res.status(400).json({ error: 'يجب أن يكون اسم الملف dental-bg.mp4' });
  }
  if (!req.body || !req.body.length) {
    return res.status(400).json({ error: 'ملف الفيديو فارغ' });
  }

  try {
    const assetsDir = path.join(__dirname, '../frontend/assets');
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
    const targetPath = path.join(assetsDir, 'dental-bg.mp4');
    fs.writeFileSync(targetPath, req.body);
    res.json({ message: 'تم استبدال الفيديو بنجاح' });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء حفظ الفيديو على الخادم' });
  }
});
app.use('/api/settings', settingsRouter);
app.use('/api/notifications', notificationsRouter);

// 6. مسار التقارير المالية الشامل (يحسب من المواعيد المؤكدة والمكتملة + السجلات الطبية)
app.get('/api/finance/summary', (req, res) => {
  const user = req.session?.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح' });
  }

  try {
    const { from, to } = req.query;
    let dateFilter = '';
    const params = [];
    if (from) { dateFilter += ' AND DATE(dr.created_at) >= ?'; params.push(from); }
    if (to) { dateFilter += ' AND DATE(dr.created_at) <= ?'; params.push(to); }

    const recordsTx = db.prepare(`
      SELECT dr.id,
             DATE(dr.created_at) AS date,
             TIME(dr.created_at) AS start_time,
             'completed' AS status,
             p.name AS patient_name,
             d.name AS doctor_name,
             COALESCE(dr.treatment, 'إجراء طبي') AS service_name,
             COALESCE(dr.cost, 0) AS amount
      FROM dental_records dr
      JOIN users p ON dr.patient_id = p.id
      JOIN users d ON dr.doctor_id = d.id
      WHERE 1=1 ${dateFilter}
      ORDER BY dr.created_at DESC
    `).all(...params);

    const totalRevenue = recordsTx.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const paidCount = recordsTx.length;

    const byServiceMap = {};
    recordsTx.forEach(r => {
      if (!byServiceMap[r.service_name]) {
        byServiceMap[r.service_name] = { service_name: r.service_name, booking_count: 0, revenue: 0 };
      }
      byServiceMap[r.service_name].booking_count += 1;
      byServiceMap[r.service_name].revenue += Number(r.amount || 0);
    });

    const revenueByService = Object.values(byServiceMap).sort((a, b) => b.revenue - a.revenue);

    res.json({
      totalRevenue,
      paidCount,
      revenueByService,
      transactions: recordsTx
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3. مسار الأطباء
app.get('/api/doctors-list', (req, res) => {
  try {
    const doctors = db
      .prepare("SELECT id, name, specialty, phone, email FROM users WHERE role = 'doctor' ORDER BY name ASC")
      .all();
    res.json({ doctors });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4. الملفات الثابتة للواجهة الأمامية
const frontendDir = path.join(__dirname, '../frontend');
app.use(express.static(frontendDir));

// 5. معالجة الروابط غير الموجودة (404) - يجب أن تكون في الأسفل بعد جميع الـ APIs
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'المسار المطلوب غير موجود' });
  }

  const custom404Path = path.join(frontendDir, '404.html');
  if (fs.existsSync(custom404Path)) {
    return res.status(404).sendFile(custom404Path);
  }

  res.status(404).send('<h1>404 - الصفحة غير موجودة</h1>');
});

// 7. تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`Server is running smoothly on http://localhost:${PORT}`);
});