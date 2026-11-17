const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// جلب الملخص المالي والتقارير للإدارة (Admin)
router.get('/summary', isAuthenticated, (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح لك بالاطلاع على التقارير المالية' });
  }

  try {
    const { from, to } = req.query;
    let dateFilter = '';
    const params = [];

    if (from) { dateFilter += ' AND DATE(dr.created_at) >= ?'; params.push(from); }
    if (to) { dateFilter += ' AND DATE(dr.created_at) <= ?'; params.push(to); }

    const transactions = db.prepare(`
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

    const totalRevenue = transactions.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const paidCount = transactions.length;

    const byServiceMap = {};
    transactions.forEach((r) => {
      if (!byServiceMap[r.service_name]) {
        byServiceMap[r.service_name] = { service_name: r.service_name, booking_count: 0, revenue: 0 };
      }
      byServiceMap[r.service_name].booking_count += 1;
      byServiceMap[r.service_name].revenue += Number(r.amount || 0);
    });

    const revenueByService = Object.values(byServiceMap).sort((a, b) => b.revenue - a.revenue);

    res.json({ totalRevenue, paidCount, revenueByService, transactions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;