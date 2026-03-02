// Content routes – public list/detail + owner CRUD
const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { validatePagination, validateContent } = require('../middleware/validate');
const { incrementCounter } = require('../middleware/logger');

const router = express.Router();

// ── GET /api/content – public feed (published only) ──
router.get('/', validatePagination(100), (req, res) => {
  try {
    const { limit, offset } = req.pagination;
    const search = req.query.search || '';

    let where = 'WHERE ct.is_published = 1';
    const params = [];
    if (search) {
      where += ' AND (ct.title LIKE ? OR ct.body LIKE ? OR c.name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (req.query.content_type) {
      where += ' AND ct.content_type = ?';
      params.push(req.query.content_type);
    }

    const total = db.prepare(`
      SELECT COUNT(*) as c FROM content ct
      JOIN creators c ON c.id = ct.creator_id
      ${where}
    `).get(...params).c;

    const rows = db.prepare(`
      SELECT ct.*, c.name as creator_name, c.profile_slug as creator_slug, c.role as creator_role
      FROM content ct
      JOIN creators c ON c.id = ct.creator_id
      ${where}
      ORDER BY ct.feed_rank_at DESC, ct.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({ data: rows, total, page: req.pagination.page, limit });
  } catch (err) {
    console.error('List content error:', err);
    res.status(500).json({ error: 'Failed to list content' });
  }
});

// ── GET /api/content/mine – owner's posts ──
router.get('/mine', authenticate, validatePagination(100), (req, res) => {
  try {
    const { limit, offset } = req.pagination;
    const creatorId = req.user.creatorId;

    const total = db.prepare('SELECT COUNT(*) as c FROM content WHERE creator_id = ?').get(creatorId).c;
    const rows = db.prepare(`
      SELECT ct.*, c.name as creator_name, c.profile_slug as creator_slug
      FROM content ct
      JOIN creators c ON c.id = ct.creator_id
      WHERE ct.creator_id = ?
      ORDER BY ct.created_at DESC
      LIMIT ? OFFSET ?
    `).all(creatorId, limit, offset);

    res.json({ data: rows, total, page: req.pagination.page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list your content' });
  }
});

// ── GET /api/content/:id ──
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT ct.*, c.name as creator_name, c.profile_slug as creator_slug, c.role as creator_role
      FROM content ct
      JOIN creators c ON c.id = ct.creator_id
      WHERE ct.id = ?
    `).get(req.params.id);

    if (!row) return res.status(404).json({ error: 'Content not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get content' });
  }
});

// ── POST /api/content – create (auth required) ──
router.post('/', authenticate, validateContent, (req, res) => {
  try {
    const { title, body, media_url, content_type } = req.body;
    const creatorId = req.user.creatorId;

    const result = db.prepare(`
      INSERT INTO content (creator_id, content_type, title, body, media_url, is_published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
    `).run(creatorId, content_type || 'article', title, body || '', media_url);

    // Add to moderation queue
    db.prepare(`
      INSERT INTO moderation_queue (type, status, title_or_name, submitted_by, entity_id)
      VALUES (?, ?, ?, ?, ?)
    `).run('content', 'pending', title, req.user.email, result.lastInsertRowid);

    db.prepare('INSERT INTO audit_log (action_type, actor, target) VALUES (?, ?, ?)')
      .run('content.create', req.user.email, `content:${result.lastInsertRowid}`);

    incrementCounter('content.create');

    const created = db.prepare('SELECT * FROM content WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Content created (pending review)', data: created });
  } catch (err) {
    console.error('Create content error:', err);
    res.status(500).json({ error: 'Failed to create content' });
  }
});

// ── PUT /api/content/:id – update own content ──
router.put('/:id', authenticate, validateContent, (req, res) => {
  try {
    const contentId = req.params.id;
    const existing = db.prepare('SELECT * FROM content WHERE id = ?').get(contentId);

    if (!existing) return res.status(404).json({ error: 'Content not found' });
    if (existing.creator_id !== req.user.creatorId) {
      return res.status(403).json({ error: 'You can only edit your own content' });
    }

    const { title, body, media_url, content_type } = req.body;

    db.prepare(`
      UPDATE content SET title = ?, body = ?, media_url = ?, content_type = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(title, body || existing.body, media_url, content_type || existing.content_type, contentId);

    db.prepare('INSERT INTO audit_log (action_type, actor, target, before_snapshot) VALUES (?, ?, ?, ?)')
      .run('content.update', req.user.email, `content:${contentId}`, JSON.stringify(existing));

    incrementCounter('content.update');

    const updated = db.prepare('SELECT * FROM content WHERE id = ?').get(contentId);
    res.json({ message: 'Content updated', data: updated });
  } catch (err) {
    console.error('Update content error:', err);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// ── DELETE /api/content/:id – delete own content ──
router.delete('/:id', authenticate, (req, res) => {
  try {
    const contentId = req.params.id;
    const existing = db.prepare('SELECT * FROM content WHERE id = ?').get(contentId);

    if (!existing) return res.status(404).json({ error: 'Content not found' });
    if (existing.creator_id !== req.user.creatorId) {
      return res.status(403).json({ error: 'You can only delete your own content' });
    }

    db.prepare('DELETE FROM content WHERE id = ?').run(contentId);
    db.prepare('DELETE FROM moderation_queue WHERE entity_id = ? AND type = ?').run(contentId, 'content');

    db.prepare('INSERT INTO audit_log (action_type, actor, target, before_snapshot) VALUES (?, ?, ?, ?)')
      .run('content.delete', req.user.email, `content:${contentId}`, JSON.stringify(existing));

    incrementCounter('content.delete');

    res.json({ message: 'Content deleted' });
  } catch (err) {
    console.error('Delete content error:', err);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

module.exports = router;
