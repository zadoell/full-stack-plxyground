// Creator routes
const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validate');

const router = express.Router();

// ── GET /api/creators – list creators ──
router.get('/', validatePagination(100), (req, res) => {
  try {
    const { limit, offset } = req.pagination;
    const search = req.query.search || '';

    let where = 'WHERE c.is_active = 1';
    const params = [];
    if (search) {
      where += ' AND (c.name LIKE ? OR c.bio LIKE ? OR c.location LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (req.query.role) {
      where += ' AND c.role = ?';
      params.push(req.query.role);
    }

    const total = db.prepare(`SELECT COUNT(*) as c FROM creators c ${where}`).get(...params).c;
    const rows = db.prepare(`
      SELECT c.*, ca.email
      FROM creators c
      LEFT JOIN creator_accounts ca ON ca.creator_id = c.id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({ data: rows, total, page: req.pagination.page, limit });
  } catch (err) {
    console.error('List creators error:', err);
    res.status(500).json({ error: 'Failed to list creators' });
  }
});

// ── GET /api/creators/:id ──
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT c.*, ca.email
      FROM creators c
      LEFT JOIN creator_accounts ca ON ca.creator_id = c.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!row) return res.status(404).json({ error: 'Creator not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get creator' });
  }
});

// ── GET /api/creators/slug/:slug ──
router.get('/slug/:slug', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT c.*, ca.email
      FROM creators c
      LEFT JOIN creator_accounts ca ON ca.creator_id = c.id
      WHERE c.profile_slug = ?
    `).get(req.params.slug);

    if (!row) return res.status(404).json({ error: 'Creator not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get creator' });
  }
});

// ── PUT /api/creators/me – update own profile ──
router.put('/me', authenticate, (req, res) => {
  try {
    const { bio, location, social_links, name } = req.body;
    const creatorId = req.user.creatorId;

    // Validate social_links if provided
    if (social_links) {
      if (typeof social_links === 'string') {
        try { JSON.parse(social_links); } catch {
          return res.status(400).json({ error: 'social_links must be valid JSON' });
        }
      }
    }

    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name.trim()); }
    if (bio !== undefined) { updates.push('bio = ?'); params.push(bio.trim()); }
    if (location !== undefined) { updates.push('location = ?'); params.push(location.trim()); }
    if (social_links !== undefined) {
      updates.push('social_links = ?');
      params.push(typeof social_links === 'string' ? social_links : JSON.stringify(social_links));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push("updated_at = datetime('now')");
    params.push(creatorId);

    db.prepare(`UPDATE creators SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updated = db.prepare('SELECT * FROM creators WHERE id = ?').get(creatorId);
    res.json({ message: 'Profile updated', data: updated });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
