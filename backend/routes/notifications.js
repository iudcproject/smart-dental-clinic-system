const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// 1. جلب إشعارات المستخدم الحالي وعدد غير المقروءة
router.get('/', isAuthenticated, (req, res) => {
  try {
    const userId = req.session.user.id;
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY id DESC 
      LIMIT 20
    `).all(userId);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(userId).count;

    res.json({ notifications, unreadCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. تحديد إشعار فردي كمقروء
router.patch('/:id/read', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
    res.json({ message: 'تم تحديث حالة الإشعار' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3. تحديد كافة إشعارات المستخدم الحالي كمقروءة (المسار الجديد)
router.patch('/read-all', isAuthenticated, (req, res) => {
  try {
    const userId = req.session.user.id;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
    res.json({ message: 'تم تحديث كافة الإشعارات كمقروءة' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;