const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// جلب الملخص المالي والتقارير للإدارة (Admin)
router.get('/summary', isAuthenticated, (req, res) => {
  try {
    if (req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'غير مصرح لك بالاطلاع على التقارير المالية' });
    }

    // 1. إجمالي الإيرادات من المواعيد المكتملة أو المؤكدة
    const totalRevenueRow = db.prepare(`
      SELECT SUM(s.price) as total 
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.status IN ('confirmed', 'completed')
    `).get();
    const totalRevenue = totalRevenueRow ? (totalRevenueRow.total || 0) : 0;

    // 2. عدد الحجوزات المدفوعة / المؤكدة
    const paidCountRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE status IN ('confirmed', 'completed')
    `).get();
    const paidCount = paidCountRow ? paidCountRow.count : 0;

    // 3. الإيرادات موزعة حسب الخدمات
    const revenueByService = db.prepare(`
      SELECT s.name as service_name, COUNT(a.id) as booking_count, SUM(s.price) as revenue
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.status IN ('confirmed', 'completed')
      GROUP BY s.id
      ORDER BY revenue DESC
    `).all();

    // 4. الإيرادات موزعة حسب الأطباء
    const revenueByDoctor = db.prepare(`
      SELECT d.name as doctor_name, COUNT(a.id) as booking_count, SUM(s.price) as revenue
      FROM appointments a
      JOIN users d ON a.doctor_id = d.id
      JOIN services s ON a.service_id = s.id
      WHERE a.status IN ('confirmed', 'completed')
      GROUP BY d.id
      ORDER BY revenue DESC
    `).all();

    res.json({
      totalRevenue,
      paidCount,
      revenueByService,
      revenueByDoctor
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;