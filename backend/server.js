const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// 1. إعدادات الأمان والترويسات الأساسية
app.disable('x-powered-by');
if (isProduction) {
  app.set('trust proxy', 1);
}

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 2. إدارة الجلسات
if (!process.env.SESSION_SECRET) {
  console.warn('[Security Warning] SESSION_SECRET is not set in .env; using fallback secret.');
}

app.use(
  session({
    name: 'clinic.sid',
    secret: process.env.SESSION_SECRET || 'clinic-fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

// 3. مسار فحص جاهزية السيرفر وربط مسارات الـ API المعيارية
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const apiRoutes = [
  ['/api/auth', './routes/auth'],
  ['/api/services', './routes/services'],
  ['/api/admin', './routes/admin'],
  ['/api/appointments', './routes/appointments'],
  ['/api/patients', './routes/patients'],
  ['/api/dental', './routes/dental'],
  ['/api/profile', './routes/profile'],
  ['/api/ai', './routes/ai'],
  ['/api/settings', './routes/settings'],
  ['/api/notifications', './routes/notifications'],
  ['/api/finance', './routes/finance'],
  ['/api/doctors-list', './routes/doctors']
];

apiRoutes.forEach(([routePath, modulePath]) => {
  app.use(routePath, require(modulePath));
});

// 4. الملفات الثابتة للواجهة الأمامية
const frontendDir = path.join(__dirname, '../frontend');
app.use(express.static(frontendDir));

// 5. معالجة الروابط غير الموجودة (404)
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

// 6. الوسيط المركزي لمعالجة الأخطاء (Global Error Handler)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'تنسيق بيانات JSON المرسلة غير صالح' });
  }

  console.error(`[Server Error] ${req.method} ${req.originalUrl}:`, err);
  const statusCode = err.status || err.statusCode || 500;
  const message = isProduction && statusCode === 500
    ? 'حدث خطأ داخلي في الخادم، يرجى المحاولة لاحقاً'
    : (err.message || 'حدث خطأ غير متوقع');

  if (req.path.startsWith('/api/')) {
    return res.status(statusCode).json({ error: message });
  }
  res.status(statusCode).send(`<h1>${statusCode} - ${message}</h1>`);
});

// 7. تشغيل السيرفر والإغلاق الآمن
const server = app.listen(PORT, () => {
  console.log(`Server is running smoothly on http://localhost:${PORT}`);
});

function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Closing HTTP server gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));