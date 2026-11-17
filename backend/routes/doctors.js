const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
  try {
    const doctors = db
      .prepare("SELECT id, name, specialty, phone, email FROM users WHERE role = 'doctor' ORDER BY name ASC")
      .all();
    res.json({ doctors });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;