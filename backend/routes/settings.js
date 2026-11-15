const express = require('express');
const router = express.Router();
const db = require('../config/db');

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'هذه الصلاحية مخصصة لمدير النظام فقط' });
  }
  next();
}

// جلب جميع إعدادات ومعلومات العيادة (متاح للواجهة الرئيسية ولوحة التحكم)
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT setting_key, setting_value FROM clinic_settings').all();
    const settings = {};
    for (const row of rows) {
      settings[row.setting_key] = row.setting_value;
    }
    res.json({ settings });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// تحديث إعدادات ومعلومات العيادة بالكامل (للأدمن فقط)
router.put('/', requireAdmin, (req, res) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'بيانات الإعدادات غير صالحة' });
    }

    const upsert = db.prepare(`
      INSERT INTO clinic_settings (setting_key, setting_value)
      VALUES (?, ?)
      ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value
    `);

    const applyAll = db.transaction((entries) => {
      for (const [key, value] of entries) {
        if (value !== undefined && value !== null) {
          upsert.run(String(key).trim(), String(value).trim());
        }
      }
    });

    applyAll(Object.entries(updates));

    const rows = db.prepare('SELECT setting_key, setting_value FROM clinic_settings').all();
    const settings = {};
    for (const row of rows) {
      settings[row.setting_key] = row.setting_value;
    }

    res.json({ message: 'تم حفظ إعدادات ومعلومات العيادة بنجاح', settings });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;