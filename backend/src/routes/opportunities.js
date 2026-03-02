// Opportunities routes
const express = require('express');
const db = require('../db');
const { validatePagination } = require('../middleware/validate');

const router = express.Router();

// ── GET /api/opportunities ──
router.get('/', validatePagination(100), (req, res) => {
  try {
    const { limit, offset } = req.pagination;

    const total = db.prepare('SELECT COUNT(*) as c FROM opportunities WHERE is_published = 1').get().c;
    const rows = db.prepare(`
      SELECT o.*, c.name as creator_name
      FROM opportunities o
      JOIN creators c ON c.id = o.creator_id
      WHERE o.is_published = 1
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    res.json({ data: rows, total, page: req.pagination.page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list opportunities' });
  }
});

module.exports = router;
