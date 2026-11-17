const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

db.prepare(`
  CREATE TABLE IF NOT EXISTS clinic_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT
  )
`).run();

// جلب الإعدادات الحالية
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT setting_key, setting_value FROM clinic_settings').all();
    const settings = {};
    rows.forEach((r) => { settings[r.setting_key] = r.setting_value; });
    res.json(settings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// حفظ أو تحديث الإعدادات
router.post('/', isAuthenticated, (req, res) => {
  try {
    if (req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'غير مصرح لك بتعديل الإعدادات' });
    }

    const upsert = db.prepare(`
      INSERT INTO clinic_settings (setting_key, setting_value)
      VALUES (?, ?)
      ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value
    `);

    const updateMany = db.transaction((data) => {
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null && value !== '') {
          upsert.run(key, String(value));
        }
      }
    });

    updateMany(req.body);
    res.json({ message: 'تم تحديث الإعدادات بنجاح' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// استبدال الفيديو الخلفي للصفحة الرئيسية (للأدمن فقط، اسم dental-bg.mp4، حد 4MB)
router.post('/upload-video', isAuthenticated, express.raw({ type: 'video/mp4', limit: '4mb' }), (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح لك بتغيير الفيديو' });
  }
  if (req.headers['x-file-name'] !== 'dental-bg.mp4') {
    return res.status(400).json({ error: 'يجب أن يكون اسم الملف dental-bg.mp4' });
  }
  if (!req.body || !req.body.length) {
    return res.status(400).json({ error: 'ملف الفيديو فارغ' });
  }
  if (req.body.length > 4 * 1024 * 1024) {
    return res.status(400).json({ error: 'حجم الفيديو يتجاوز الحد المسموح به (4 ميجابايت)' });
  }

  try {
    const assetsDir = path.join(__dirname, '../../frontend/assets');
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
    fs.writeFileSync(path.join(assetsDir, 'dental-bg.mp4'), req.body);
    res.json({ message: 'تم استبدال الفيديو بنجاح' });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء حفظ الفيديو على الخادم' });
  }
});

module.exports = router;