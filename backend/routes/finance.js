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
    const averageRevenue = paidCount > 0 ? Math.round((totalRevenue / paidCount) * 100) / 100 : 0;

    // حساب الإيرادات المتوقعة من المواعيد المؤكدة وقيد الانتظار
    let apptFilter = '';
    const apptParams = [];
    if (from) { apptFilter += ' AND a.date >= ?'; apptParams.push(from); }
    if (to) { apptFilter += ' AND a.date <= ?'; apptParams.push(to); }

    const pendingRow = db.prepare(`
      SELECT COALESCE(SUM(COALESCE(s.price, 0)), 0) AS expected_revenue,
             COUNT(a.id) AS upcoming_count
      FROM appointments a
      LEFT JOIN dental_services s ON a.service_id = s.id
      WHERE a.status IN ('pending', 'confirmed') ${apptFilter}
    `).get(...apptParams);

    const byServiceMap = {};
    const byDoctorMap = {};

    transactions.forEach((r) => {
      if (!byServiceMap[r.service_name]) {
        byServiceMap[r.service_name] = { service_name: r.service_name, booking_count: 0, revenue: 0 };
      }
      byServiceMap[r.service_name].booking_count += 1;
      byServiceMap[r.service_name].revenue += Number(r.amount || 0);

      if (!byDoctorMap[r.doctor_name]) {
        byDoctorMap[r.doctor_name] = { doctor_name: r.doctor_name, session_count: 0, revenue: 0 };
      }
      byDoctorMap[r.doctor_name].session_count += 1;
      byDoctorMap[r.doctor_name].revenue += Number(r.amount || 0);
    });

    const revenueByService = Object.values(byServiceMap).sort((a, b) => b.revenue - a.revenue);
    const revenueByDoctor = Object.values(byDoctorMap).sort((a, b) => b.revenue - a.revenue);

    res.json({
      totalRevenue,
      paidCount,
      averageRevenue,
      expectedRevenue: Number(pendingRow?.expected_revenue || 0),
      upcomingCount: Number(pendingRow?.upcoming_count || 0),
      revenueByService,
      revenueByDoctor,
      transactions
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;