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
app.use('/api/appointments', appointmentsRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/dental', dentalRouter);
app.use('/api/profile', profileRouter);
app.use('/api/ai', aiRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/notifications', notificationsRouter);

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

// 6. تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`Server is running smoothly on http://localhost:${PORT}`);
});