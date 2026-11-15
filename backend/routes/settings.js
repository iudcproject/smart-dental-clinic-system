const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// إنشاء جدول الإعدادات تلقائياً إذا لم يكن موجوداً لضمان عدم حدوث أخطاء
db.prepare(`
  CREATE TABLE IF NOT EXISTS clinic_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT
  )
`).run();

// جلب الإعدادات الحالية لعرضها في الحقول
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT setting_key, setting_value FROM clinic_settings').all();
    const settings = {};
    rows.forEach(r => {
      settings[r.setting_key] = r.setting_value;
    });
    res.json(settings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// حفظ أو تحديث الإعدادات (يدعم التحديث الجزئي لأي حقل يتم تغييره فقط)
router.post('/', isAuthenticated, (req, res) => {
  try {
    if (req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'غير مصرح لك بتعديل الإعدادات' });
    }

    const updates = req.body;
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

    updateMany(updates);
    res.json({ message: 'تم تحديث الإعدادات بنجاح' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;