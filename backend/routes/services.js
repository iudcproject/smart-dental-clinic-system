const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAdmin } = require('../middleware/auth');

// جلب جميع خدمات العيادة (متاحة للجميع للعرض والحجز)
router.get('/', (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM dental_services ORDER BY id DESC').all();
    res.json({ services });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// إضافة خدمة جديدة (للأدمن فقط)
router.post('/', isAdmin, (req, res) => {
  try {
    const { name, description, price, duration } = req.body;
    if (!name || price === undefined || price === '') {
      return res.status(400).json({ error: 'اسم الخدمة والسعر مطلوبان' });
    }

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ error: 'يرجى إدخال سعر صحيح' });
    }

    const info = db.prepare(`
      INSERT INTO dental_services (name, description, price, duration)
      VALUES (?, ?, ?, ?)
    `).run(name.trim(), description || '', numericPrice, Number(duration) || 30);

    const newService = db.prepare('SELECT * FROM dental_services WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ message: 'تمت إضافة الخدمة بنجاح', service: newService });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// تعديل خدمة قائمة وأسعارها (للأدمن فقط)
router.put('/:id', isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration } = req.body;

    const existing = db.prepare('SELECT * FROM dental_services WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'الخدمة غير موجودة' });
    }

    const updatedName = name ? name.trim() : existing.name;
    const updatedDescription = description !== undefined ? description : existing.description;
    const updatedPrice = (price !== undefined && price !== '') ? Number(price) : existing.price;
    const updatedDuration = (duration !== undefined && duration !== '') ? Number(duration) : existing.duration;

    if (Number.isNaN(updatedPrice) || updatedPrice < 0) {
      return res.status(400).json({ error: 'يرجى إدخال سعر صحيح' });
    }

    db.prepare(`
      UPDATE dental_services
      SET name = ?, description = ?, price = ?, duration = ?
      WHERE id = ?
    `).run(updatedName, updatedDescription, updatedPrice, updatedDuration, id);

    const updatedService = db.prepare('SELECT * FROM dental_services WHERE id = ?').get(id);
    res.json({ message: 'تم تحديث الخدمة بنجاح', service: updatedService });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// حذف خدمة (للأدمن فقط)
router.delete('/:id', isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM dental_services WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'الخدمة غير موجودة' });
    }

    db.prepare('DELETE FROM dental_services WHERE id = ?').run(id);
    res.json({ message: 'تم حذف الخدمة بنجاح' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// تعديل خدمة علاجية موجودة (للأدمن فقط)
router.put('/:id', isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'اسم الخدمة مطلوب' });
    }

    const stmt = db.prepare(`
      UPDATE dental_services 
      SET name = ?, description = ?, price = ?, duration = ?
      WHERE id = ?
    `);
    const result = stmt.run(name, description || '', price || 0, duration || 30, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'الخدمة غير موجودة' });
    }

    res.json({ message: 'تم تحديث الخدمة بنجاح' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;