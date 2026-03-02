// Admin routes – all require ADMIN role
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validate');
const { incrementCounter } = require('../middleware/logger');

const router = express.Router();
const SALT_ROUNDS = 10;

// ── Admin Login (no auth middleware – this IS the auth endpoint) ──
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE email = ? AND is_active = 1').get(email.toLowerCase().trim());
    if (!admin) {
      incrementCounter('auth.failure');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      incrementCounter('auth.failure');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'ADMIN' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    db.prepare('INSERT INTO audit_log (action_type, actor, target) VALUES (?, ?, ?)')
      .run('admin.login', admin.email, 'system');

    incrementCounter('auth.success');
    res.json({ message: 'Admin login successful', token, user: { id: admin.id, email: admin.email, role: 'ADMIN' } });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── All routes below require ADMIN ──
router.use(authenticate, requireRole('ADMIN'));

// ── Queue ──
router.get('/queue', validatePagination(2000), (req, res) => {
  try {
    const { limit, offset } = req.pagination;
    const status = req.query.status || '';

    let where = '1=1';
    const params = [];
    if (status) { where += ' AND status = ?'; params.push(status); }

    const total = db.prepare(`SELECT COUNT(*) as c FROM moderation_queue WHERE ${where}`).get(...params).c;
    const rows = db.prepare(`
      SELECT * FROM moderation_queue WHERE ${where}
      ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({ data: rows, total, page: req.pagination.page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list queue' });
  }
});

// ── Bulk action on queue ──
router.post('/queue/bulk-action', (req, res) => {
  try {
    const { ids, action, assigned_admin } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array required' });
    }
    if (!['approve', 'reject', 'delete', 'assign'].includes(action)) {
      return res.status(400).json({ error: 'action must be approve|reject|delete|assign' });
    }

    // Save previous state for undo
    const prevStates = [];
    for (const id of ids) {
      const row = db.prepare('SELECT * FROM moderation_queue WHERE id = ?').get(id);
      if (row) prevStates.push(row);
    }

    const placeholders = ids.map(() => '?').join(',');

    if (action === 'approve') {
      db.prepare(`UPDATE moderation_queue SET status = 'approved', updated_at = datetime('now') WHERE id IN (${placeholders})`).run(...ids);
      // Also publish related content
      for (const ps of prevStates) {
        if (ps.type === 'content' && ps.entity_id) {
          db.prepare("UPDATE content SET is_published = 1, published_at = datetime('now'), feed_rank_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(ps.entity_id);
        }
      }
    } else if (action === 'reject') {
      db.prepare(`UPDATE moderation_queue SET status = 'rejected', updated_at = datetime('now') WHERE id IN (${placeholders})`).run(...ids);
    } else if (action === 'delete') {
      db.prepare(`DELETE FROM moderation_queue WHERE id IN (${placeholders})`).run(...ids);
    } else if (action === 'assign') {
      db.prepare(`UPDATE moderation_queue SET assigned_admin = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`).run(assigned_admin || req.user.email, ...ids);
    }

    // Log bulk action
    const bulkLog = db.prepare(`
      INSERT INTO bulk_action_log (admin, action_type, target_type, target_ids, previous_state, undo_window_expires_at)
      VALUES (?, ?, ?, ?, ?, datetime('now', '+5 minutes'))
    `).run(req.user.email, action, 'queue', JSON.stringify(ids), JSON.stringify(prevStates));

    db.prepare('INSERT INTO audit_log (action_type, actor, target, metadata) VALUES (?, ?, ?, ?)')
      .run(`queue.bulk.${action}`, req.user.email, `queue:[${ids.join(',')}]`, JSON.stringify({ count: ids.length }));

    incrementCounter('moderation.action');

    res.json({ message: `Bulk ${action} completed on ${ids.length} items`, bulkActionId: bulkLog.lastInsertRowid });
  } catch (err) {
    console.error('Bulk action error:', err);
    res.status(500).json({ error: 'Bulk action failed' });
  }
});

// ── Bulk action undo ──
router.post('/queue/bulk-action/undo', (req, res) => {
  try {
    const { bulkActionId } = req.body;
    if (!bulkActionId) return res.status(400).json({ error: 'bulkActionId required' });

    const bulkLog = db.prepare('SELECT * FROM bulk_action_log WHERE id = ? AND undone_at IS NULL').get(bulkActionId);
    if (!bulkLog) return res.status(404).json({ error: 'Bulk action not found or already undone' });

    if (new Date(bulkLog.undo_window_expires_at) < new Date()) {
      return res.status(400).json({ error: 'Undo window has expired' });
    }

    const prevStates = JSON.parse(bulkLog.previous_state);
    for (const ps of prevStates) {
      db.prepare(`
        UPDATE moderation_queue SET status = ?, assigned_admin = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(ps.status, ps.assigned_admin, ps.id);

      if (ps.type === 'content' && ps.entity_id && ps.status === 'pending') {
        db.prepare("UPDATE content SET is_published = 0, published_at = NULL, updated_at = datetime('now') WHERE id = ?").run(ps.entity_id);
      }
    }

    db.prepare("UPDATE bulk_action_log SET undone_at = datetime('now') WHERE id = ?").run(bulkActionId);

    res.json({ message: 'Bulk action undone' });
  } catch (err) {
    console.error('Undo error:', err);
    res.status(500).json({ error: 'Undo failed' });
  }
});

// ── Content management ──
router.get('/content', validatePagination(2000), (req, res) => {
  try {
    const { limit, offset } = req.pagination;
    const search = req.query.search || '';

    let where = '1=1';
    const params = [];
    if (search) {
      where += ' AND (ct.title LIKE ? OR ct.body LIKE ? OR c.name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (req.query.status === 'published') {
      where += ' AND ct.is_published = 1';
    } else if (req.query.status === 'pending') {
      where += ' AND ct.is_published = 0';
    }

    const total = db.prepare(`
      SELECT COUNT(*) as c FROM content ct
      JOIN creators c ON c.id = ct.creator_id
      WHERE ${where}
    `).get(...params).c;

    const rows = db.prepare(`
      SELECT ct.*, c.name as creator_name, c.profile_slug as creator_slug
      FROM content ct
      JOIN creators c ON c.id = ct.creator_id
      WHERE ${where}
      ORDER BY ct.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({ data: rows, total, page: req.pagination.page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list content' });
  }
});

router.put('/content/:id', (req, res) => {
  try {
    const contentId = req.params.id;
    const existing = db.prepare('SELECT * FROM content WHERE id = ?').get(contentId);
    if (!existing) return res.status(404).json({ error: 'Content not found' });

    const { is_published, title, body, media_url } = req.body;
    const updates = [];
    const params = [];

    if (is_published !== undefined) {
      updates.push('is_published = ?');
      params.push(is_published ? 1 : 0);
      if (is_published) {
        updates.push("published_at = datetime('now')");
        updates.push("feed_rank_at = datetime('now')");
      }
    }
    if (title) { updates.push('title = ?'); params.push(title.trim()); }
    if (body !== undefined) { updates.push('body = ?'); params.push(body); }
    if (media_url) { updates.push('media_url = ?'); params.push(media_url.trim()); }
    updates.push("updated_at = datetime('now')");
    params.push(contentId);

    db.prepare(`UPDATE content SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    db.prepare('INSERT INTO audit_log (action_type, actor, target, before_snapshot, after_snapshot) VALUES (?, ?, ?, ?, ?)')
      .run('admin.content.update', req.user.email, `content:${contentId}`, JSON.stringify(existing), JSON.stringify(req.body));

    // Update moderation queue status if publishing
    if (is_published) {
      db.prepare("UPDATE moderation_queue SET status = 'approved', updated_at = datetime('now') WHERE entity_id = ? AND type = 'content'").run(contentId);
    }

    const updated = db.prepare('SELECT * FROM content WHERE id = ?').get(contentId);
    res.json({ message: 'Content updated', data: updated });
  } catch (err) {
    console.error('Admin update content error:', err);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

router.delete('/content/:id', (req, res) => {
  try {
    const contentId = req.params.id;
    const existing = db.prepare('SELECT * FROM content WHERE id = ?').get(contentId);
    if (!existing) return res.status(404).json({ error: 'Content not found' });

    db.prepare('DELETE FROM content WHERE id = ?').run(contentId);
    db.prepare("DELETE FROM moderation_queue WHERE entity_id = ? AND type = 'content'").run(contentId);

    db.prepare('INSERT INTO audit_log (action_type, actor, target, before_snapshot) VALUES (?, ?, ?, ?)')
      .run('admin.content.delete', req.user.email, `content:${contentId}`, JSON.stringify(existing));

    incrementCounter('content.delete');
    res.json({ message: 'Content deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

// ── User management ──
router.get('/users', validatePagination(2000), (req, res) => {
  try {
    const { limit, offset } = req.pagination;
    const search = req.query.search || '';

    let where = '1=1';
    const params = [];
    if (search) {
      where += ' AND (c.name LIKE ? OR ca.email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s);
    }
    if (req.query.role) {
      where += ' AND c.role = ?';
      params.push(req.query.role);
    }

    const total = db.prepare(`
      SELECT COUNT(*) as c FROM creators c
      LEFT JOIN creator_accounts ca ON ca.creator_id = c.id
      WHERE ${where}
    `).get(...params).c;

    const rows = db.prepare(`
      SELECT c.*, ca.email, ca.is_approved
      FROM creators c
      LEFT JOIN creator_accounts ca ON ca.creator_id = c.id
      WHERE ${where}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({ data: rows, total, page: req.pagination.page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list users' });
  }
});

router.post('/users/:userId/suspend', (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const user = db.prepare('SELECT * FROM creators WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newState = user.is_suspended ? 0 : 1;
    db.prepare("UPDATE creators SET is_suspended = ?, suspend_reason = ?, updated_at = datetime('now') WHERE id = ?")
      .run(newState, newState ? (reason || 'Suspended by admin') : null, userId);

    db.prepare('INSERT INTO audit_log (action_type, actor, target, before_snapshot, after_snapshot, reason) VALUES (?, ?, ?, ?, ?, ?)')
      .run(newState ? 'user.suspend' : 'user.reactivate', req.user.email, `user:${userId}`,
        JSON.stringify({ is_suspended: user.is_suspended }),
        JSON.stringify({ is_suspended: newState }),
        reason || '');

    res.json({ message: newState ? 'User suspended' : 'User reactivated', is_suspended: newState });
  } catch (err) {
    res.status(500).json({ error: 'Failed to suspend/reactivate user' });
  }
});

router.post('/users/:userId/role', (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['creator', 'business'].includes(role)) {
      return res.status(400).json({ error: 'Role must be creator or business' });
    }

    // Single-admin guard: don't allow changing to ADMIN
    if (role === 'ADMIN') {
      return res.status(403).json({ error: 'Cannot assign ADMIN role through this endpoint. Single-admin policy enforced.' });
    }

    const user = db.prepare('SELECT * FROM creators WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    db.prepare("UPDATE creators SET role = ?, updated_at = datetime('now') WHERE id = ?").run(role, userId);

    db.prepare('INSERT INTO audit_log (action_type, actor, target, before_snapshot, after_snapshot) VALUES (?, ?, ?, ?, ?)')
      .run('user.role.change', req.user.email, `user:${userId}`,
        JSON.stringify({ role: user.role }), JSON.stringify({ role }));

    res.json({ message: `Role updated to ${role}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

router.put('/users/:userId/role', (req, res) => {
  // Alias for POST
  return router.handle(Object.assign(req, { method: 'POST' }), res);
});

router.post('/users/:userId/email-verify', (req, res) => {
  try {
    const { userId } = req.params;
    const user = db.prepare('SELECT * FROM creators WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newState = user.email_verified ? 0 : 1;
    db.prepare("UPDATE creators SET email_verified = ?, updated_at = datetime('now') WHERE id = ?").run(newState, userId);

    db.prepare('INSERT INTO audit_log (action_type, actor, target) VALUES (?, ?, ?)')
      .run('user.email.verify', req.user.email, `user:${userId}`);

    res.json({ message: newState ? 'Email verified' : 'Email unverified', email_verified: newState });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle email verification' });
  }
});

router.put('/users/:userId/email-verify', (req, res) => {
  try {
    const { userId } = req.params;
    const user = db.prepare('SELECT * FROM creators WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newState = user.email_verified ? 0 : 1;
    db.prepare("UPDATE creators SET email_verified = ?, updated_at = datetime('now') WHERE id = ?").run(newState, userId);

    db.prepare('INSERT INTO audit_log (action_type, actor, target) VALUES (?, ?, ?)')
      .run('user.email.verify', req.user.email, `user:${userId}`);

    res.json({ message: newState ? 'Email verified' : 'Email unverified', email_verified: newState });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle email verification' });
  }
});

router.post('/users/reset-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'userId and newPassword required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const account = db.prepare('SELECT * FROM creator_accounts WHERE creator_id = ?').get(userId);
    if (!account) return res.status(404).json({ error: 'User account not found' });

    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    db.prepare("UPDATE creator_accounts SET password_hash = ?, updated_at = datetime('now') WHERE creator_id = ?").run(hash, userId);

    db.prepare('INSERT INTO audit_log (action_type, actor, target) VALUES (?, ?, ?)')
      .run('user.password.reset', req.user.email, `user:${userId}`);

    // Stub email notification
    if (process.env.LOCAL_STUB_EMAIL === 'true') {
      console.log(`[EMAIL STUB] Password reset notification sent to user:${userId}`);
    }

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ── Audit Log ──
router.get('/audit', validatePagination(2000), (req, res) => {
  try {
    const { limit, offset } = req.pagination;
    const total = db.prepare('SELECT COUNT(*) as c FROM audit_log').get().c;
    const rows = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
    res.json({ data: rows, total, page: req.pagination.page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list audit log' });
  }
});

router.get('/audit/export', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC').all();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-log.json');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export audit log' });
  }
});

// ── Analytics (SQL-derived KPIs) ──
router.get('/analytics', (req, res) => {
  try {
    const totalCreators = db.prepare("SELECT COUNT(*) as c FROM creators WHERE role = 'creator'").get().c;
    const totalBusinesses = db.prepare("SELECT COUNT(*) as c FROM creators WHERE role = 'business'").get().c;
    const totalContent = db.prepare('SELECT COUNT(*) as c FROM content').get().c;
    const publishedContent = db.prepare('SELECT COUNT(*) as c FROM content WHERE is_published = 1').get().c;
    const pendingContent = db.prepare('SELECT COUNT(*) as c FROM content WHERE is_published = 0').get().c;
    const last7DaysContent = db.prepare("SELECT COUNT(*) as c FROM content WHERE created_at >= datetime('now', '-7 days')").get().c;
    const totalUsers = db.prepare('SELECT COUNT(*) as c FROM creators').get().c;
    const suspendedUsers = db.prepare('SELECT COUNT(*) as c FROM creators WHERE is_suspended = 1').get().c;
    const pendingQueue = db.prepare("SELECT COUNT(*) as c FROM moderation_queue WHERE status = 'pending'").get().c;
    const totalOpportunities = db.prepare('SELECT COUNT(*) as c FROM opportunities').get().c;

    // Weekly content trend (last 4 weeks)
    const weeklyTrend = db.prepare(`
      SELECT
        strftime('%Y-W%W', created_at) as week,
        COUNT(*) as count
      FROM content
      WHERE created_at >= datetime('now', '-28 days')
      GROUP BY week
      ORDER BY week ASC
    `).all();

    // Content by type
    const byType = db.prepare(`
      SELECT content_type, COUNT(*) as count
      FROM content
      GROUP BY content_type
    `).all();

    res.json({
      kpis: {
        totalCreators,
        totalBusinesses,
        totalUsers,
        totalContent,
        publishedContent,
        pendingContent,
        last7DaysContent,
        suspendedUsers,
        pendingQueue,
        totalOpportunities,
      },
      weeklyTrend,
      byType,
      isMock: false,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// ── Live Alerts (real data – recent new content & users) ──
router.get('/alerts', (req, res) => {
  try {
    const recentContent = db.prepare(`
      SELECT ct.id, ct.title, ct.content_type, ct.created_at, c.name as creator_name, 'content' as alert_type
      FROM content ct
      JOIN creators c ON c.id = ct.creator_id
      ORDER BY ct.created_at DESC
      LIMIT 20
    `).all();

    const recentUsers = db.prepare(`
      SELECT c.id, c.name, c.role, c.created_at, 'user_signup' as alert_type
      FROM creators c
      ORDER BY c.created_at DESC
      LIMIT 20
    `).all();

    // Merge and sort by created_at
    const alerts = [...recentContent, ...recentUsers]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 20);

    res.json({
      data: alerts,
      total: alerts.length,
      isMock: false,
      note: 'Live alerts derived from recent database activity',
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load alerts' });
  }
});

// ── Admin Security – change own password ──
router.post('/security/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.user.id);
    const valid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    db.prepare("UPDATE admins SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hash, req.user.id);

    db.prepare('INSERT INTO audit_log (action_type, actor, target) VALUES (?, ?, ?)')
      .run('admin.password.change', req.user.email, `admin:${req.user.id}`);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
