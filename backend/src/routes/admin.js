// Admin routes – all require ADMIN role
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validate');
const { incrementCounter } = require('../middleware/logger');

const router = express.Router();
const SALT_ROUNDS = 10;

// ── Admin Login ──
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const { data: admin } = await supabase.from('admins').select('*').eq('email', email.toLowerCase().trim()).eq('is_active', true).maybeSingle();
    if (!admin) { incrementCounter('auth.failure'); return res.status(401).json({ error: 'Invalid credentials' }); }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) { incrementCounter('auth.failure'); return res.status(401).json({ error: 'Invalid credentials' }); }

    const token = jwt.sign({ id: admin.id, email: admin.email, role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    await supabase.from('audit_log').insert({ action_type: 'admin.login', actor: admin.email, target: 'system' });
    incrementCounter('auth.success');
    res.json({ message: 'Admin login successful', token, user: { id: admin.id, email: admin.email, role: 'ADMIN' } });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.use(authenticate, requireRole('ADMIN'));

// ── Queue ──
router.get('/queue', validatePagination(2000), async (req, res) => {
  try {
    const { limit, offset } = req.pagination;
    let query = supabase.from('moderation_queue').select('*', { count: 'exact' });
    if (req.query.status) query = query.eq('status', req.query.status);
    const { data: rows, count: total, error } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw error;
    res.json({ data: rows || [], total: total || 0, page: req.pagination.page, limit });
  } catch (err) { res.status(500).json({ error: 'Failed to list queue' }); }
});

router.post('/queue/bulk-action', async (req, res) => {
  try {
    const { ids, action, assigned_admin } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids array required' });
    if (!['approve', 'reject', 'delete', 'assign'].includes(action)) return res.status(400).json({ error: 'action must be approve|reject|delete|assign' });

    const { data: prevStates } = await supabase.from('moderation_queue').select('*').in('id', ids);
    const now = new Date().toISOString();

    if (action === 'approve') {
      await supabase.from('moderation_queue').update({ status: 'approved', updated_at: now }).in('id', ids);
      for (const ps of (prevStates || [])) {
        if (ps.type === 'content' && ps.entity_id) {
          await supabase.from('content').update({ is_published: true, published_at: now, feed_rank_at: now, updated_at: now }).eq('id', ps.entity_id);
        }
      }
    } else if (action === 'reject') {
      await supabase.from('moderation_queue').update({ status: 'rejected', updated_at: now }).in('id', ids);
    } else if (action === 'delete') {
      await supabase.from('moderation_queue').delete().in('id', ids);
    } else if (action === 'assign') {
      await supabase.from('moderation_queue').update({ assigned_admin: assigned_admin || req.user.email, updated_at: now }).in('id', ids);
    }

    const { data: bulkLog } = await supabase.from('bulk_action_log').insert({
      admin: req.user.email, action_type: action, target_type: 'queue',
      target_ids: JSON.stringify(ids), previous_state: JSON.stringify(prevStates || []),
      undo_window_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    }).select('id').single();

    await supabase.from('audit_log').insert({ action_type: `queue.bulk.${action}`, actor: req.user.email, target: `queue:[${ids.join(',')}]`, metadata: JSON.stringify({ count: ids.length }) });
    incrementCounter('moderation.action');
    res.json({ message: `Bulk ${action} completed on ${ids.length} items`, bulkActionId: bulkLog?.id });
  } catch (err) {
    console.error('Bulk action error:', err);
    res.status(500).json({ error: 'Bulk action failed' });
  }
});

router.post('/queue/bulk-action/undo', async (req, res) => {
  try {
    const { bulkActionId } = req.body;
    if (!bulkActionId) return res.status(400).json({ error: 'bulkActionId required' });

    const { data: bulkLog } = await supabase.from('bulk_action_log').select('*').eq('id', bulkActionId).is('undone_at', null).maybeSingle();
    if (!bulkLog) return res.status(404).json({ error: 'Bulk action not found or already undone' });
    if (new Date(bulkLog.undo_window_expires_at) < new Date()) return res.status(400).json({ error: 'Undo window has expired' });

    const prevStates = JSON.parse(bulkLog.previous_state);
    for (const ps of prevStates) {
      await supabase.from('moderation_queue').update({ status: ps.status, assigned_admin: ps.assigned_admin, updated_at: new Date().toISOString() }).eq('id', ps.id);
      if (ps.type === 'content' && ps.entity_id && ps.status === 'pending') {
        await supabase.from('content').update({ is_published: false, published_at: null, updated_at: new Date().toISOString() }).eq('id', ps.entity_id);
      }
    }
    await supabase.from('bulk_action_log').update({ undone_at: new Date().toISOString() }).eq('id', bulkActionId);
    res.json({ message: 'Bulk action undone' });
  } catch (err) {
    console.error('Undo error:', err);
    res.status(500).json({ error: 'Undo failed' });
  }
});

// ── Content management ──
router.get('/content', validatePagination(2000), async (req, res) => {
  try {
    const { limit, offset } = req.pagination;
    let query = supabase.from('content').select('*, creators!creator_id(name, profile_slug)', { count: 'exact' });
    if (req.query.search) query = query.or(`title.ilike.%${req.query.search}%,body.ilike.%${req.query.search}%`);
    if (req.query.status === 'published') query = query.eq('is_published', true);
    else if (req.query.status === 'pending') query = query.eq('is_published', false);
    const { data: rows, count: total, error } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw error;
    const flat = (rows || []).map(r => ({ ...r, creator_name: r.creators?.name, creator_slug: r.creators?.profile_slug, creators: undefined }));
    res.json({ data: flat, total: total || 0, page: req.pagination.page, limit });
  } catch (err) { res.status(500).json({ error: 'Failed to list content' }); }
});

router.put('/content/:id', async (req, res) => {
  try {
    const { data: existing } = await supabase.from('content').select('*').eq('id', req.params.id).maybeSingle();
    if (!existing) return res.status(404).json({ error: 'Content not found' });

    const { is_published, title, body, media_url } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (is_published !== undefined) {
      updates.is_published = !!is_published;
      if (is_published) { updates.published_at = new Date().toISOString(); updates.feed_rank_at = new Date().toISOString(); }
    }
    if (title) updates.title = title.trim();
    if (body !== undefined) updates.body = body;
    if (media_url) updates.media_url = media_url.trim();

    const { data: updated, error } = await supabase.from('content').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;

    await supabase.from('audit_log').insert({ action_type: 'admin.content.update', actor: req.user.email, target: `content:${req.params.id}`, before_snapshot: JSON.stringify(existing), after_snapshot: JSON.stringify(req.body) });
    if (is_published) await supabase.from('moderation_queue').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('entity_id', req.params.id).eq('type', 'content');
    res.json({ message: 'Content updated', data: updated });
  } catch (err) {
    console.error('Admin update content error:', err);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

router.delete('/content/:id', async (req, res) => {
  try {
    const { data: existing } = await supabase.from('content').select('*').eq('id', req.params.id).maybeSingle();
    if (!existing) return res.status(404).json({ error: 'Content not found' });
    await supabase.from('content').delete().eq('id', req.params.id);
    await supabase.from('moderation_queue').delete().eq('entity_id', req.params.id).eq('type', 'content');
    await supabase.from('audit_log').insert({ action_type: 'admin.content.delete', actor: req.user.email, target: `content:${req.params.id}`, before_snapshot: JSON.stringify(existing) });
    incrementCounter('content.delete');
    res.json({ message: 'Content deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete content' }); }
});

// ── User management ──
router.get('/users', validatePagination(2000), async (req, res) => {
  try {
    const { limit, offset } = req.pagination;
    let query = supabase.from('creators').select('*, creator_accounts!creator_id(email, is_approved)', { count: 'exact' });
    if (req.query.search) query = query.or(`name.ilike.%${req.query.search}%`);
    if (req.query.role) query = query.eq('role', req.query.role);
    const { data: rows, count: total, error } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw error;
    const flat = (rows || []).map(r => {
      const acct = Array.isArray(r.creator_accounts) ? r.creator_accounts[0] : r.creator_accounts;
      return { ...r, email: acct?.email, is_approved: acct?.is_approved, creator_accounts: undefined };
    });
    res.json({ data: flat, total: total || 0, page: req.pagination.page, limit });
  } catch (err) { res.status(500).json({ error: 'Failed to list users' }); }
});

router.post('/users/:userId/suspend', async (req, res) => {
  try {
    const { data: user } = await supabase.from('creators').select('*').eq('id', req.params.userId).maybeSingle();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const newState = !user.is_suspended;
    await supabase.from('creators').update({ is_suspended: newState, suspend_reason: newState ? (req.body.reason || 'Suspended by admin') : null, updated_at: new Date().toISOString() }).eq('id', req.params.userId);
    await supabase.from('audit_log').insert({ action_type: newState ? 'user.suspend' : 'user.reactivate', actor: req.user.email, target: `user:${req.params.userId}`, before_snapshot: JSON.stringify({ is_suspended: user.is_suspended }), after_snapshot: JSON.stringify({ is_suspended: newState }), reason: req.body.reason || '' });
    res.json({ message: newState ? 'User suspended' : 'User reactivated', is_suspended: newState });
  } catch (err) { res.status(500).json({ error: 'Failed to suspend/reactivate user' }); }
});

async function handleRoleChange(req, res) {
  try {
    const { role } = req.body;
    if (!role || !['creator', 'business', 'athlete', 'fan'].includes(role)) return res.status(400).json({ error: 'Role must be creator, business, athlete, or fan' });
    if (role === 'ADMIN') return res.status(403).json({ error: 'Cannot assign ADMIN role through this endpoint.' });
    const { data: user } = await supabase.from('creators').select('*').eq('id', req.params.userId).maybeSingle();
    if (!user) return res.status(404).json({ error: 'User not found' });
    await supabase.from('creators').update({ role, updated_at: new Date().toISOString() }).eq('id', req.params.userId);
    await supabase.from('audit_log').insert({ action_type: 'user.role.change', actor: req.user.email, target: `user:${req.params.userId}`, before_snapshot: JSON.stringify({ role: user.role }), after_snapshot: JSON.stringify({ role }) });
    res.json({ message: `Role updated to ${role}` });
  } catch (err) { res.status(500).json({ error: 'Failed to update role' }); }
}
router.post('/users/:userId/role', handleRoleChange);
router.put('/users/:userId/role', handleRoleChange);

async function toggleEmailVerify(req, res) {
  try {
    const { data: user } = await supabase.from('creators').select('email_verified').eq('id', req.params.userId).maybeSingle();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const newState = !user.email_verified;
    await supabase.from('creators').update({ email_verified: newState, updated_at: new Date().toISOString() }).eq('id', req.params.userId);
    await supabase.from('audit_log').insert({ action_type: 'user.email.verify', actor: req.user.email, target: `user:${req.params.userId}` });
    res.json({ message: newState ? 'Email verified' : 'Email unverified', email_verified: newState });
  } catch (err) { res.status(500).json({ error: 'Failed to toggle email verification' }); }
}
router.post('/users/:userId/email-verify', toggleEmailVerify);
router.put('/users/:userId/email-verify', toggleEmailVerify);

router.post('/users/reset-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) return res.status(400).json({ error: 'userId and newPassword required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const { data: account } = await supabase.from('creator_accounts').select('*').eq('creator_id', userId).maybeSingle();
    if (!account) return res.status(404).json({ error: 'User account not found' });
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await supabase.from('creator_accounts').update({ password_hash: hash, updated_at: new Date().toISOString() }).eq('creator_id', userId);
    await supabase.from('audit_log').insert({ action_type: 'user.password.reset', actor: req.user.email, target: `user:${userId}` });
    if (process.env.LOCAL_STUB_EMAIL === 'true') console.log(`[EMAIL STUB] Password reset notification sent to user:${userId}`);
    res.json({ message: 'Password reset successful' });
  } catch (err) { res.status(500).json({ error: 'Failed to reset password' }); }
});

// ── Audit Log ──
router.get('/audit', validatePagination(2000), async (req, res) => {
  try {
    const { limit, offset } = req.pagination;
    const { data: rows, count: total, error } = await supabase.from('audit_log').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw error;
    res.json({ data: rows || [], total: total || 0, page: req.pagination.page, limit });
  } catch (err) { res.status(500).json({ error: 'Failed to list audit log' }); }
});

router.get('/audit/export', async (req, res) => {
  try {
    const { data: rows, error } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-log.json');
    res.json(rows || []);
  } catch (err) { res.status(500).json({ error: 'Failed to export audit log' }); }
});

// ── Analytics ──
router.get('/analytics', async (req, res) => {
  try {
    const [
      { count: totalCreators }, { count: totalBusinesses }, { count: totalContent },
      { count: publishedContent }, { count: pendingContent }, { count: totalUsers },
      { count: suspendedUsers }, { count: pendingQueue }, { count: totalOpportunities },
      { count: last7DaysContent },
    ] = await Promise.all([
      supabase.from('creators').select('*', { count: 'exact', head: true }).eq('role', 'creator'),
      supabase.from('creators').select('*', { count: 'exact', head: true }).eq('role', 'business'),
      supabase.from('content').select('*', { count: 'exact', head: true }),
      supabase.from('content').select('*', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('content').select('*', { count: 'exact', head: true }).eq('is_published', false),
      supabase.from('creators').select('*', { count: 'exact', head: true }),
      supabase.from('creators').select('*', { count: 'exact', head: true }).eq('is_suspended', true),
      supabase.from('moderation_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('opportunities').select('*', { count: 'exact', head: true }),
      supabase.from('content').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7*24*60*60*1000).toISOString()),
    ]);

    const { data: contentRows } = await supabase.from('content').select('content_type');
    const byTypeMap = {};
    for (const r of (contentRows || [])) byTypeMap[r.content_type] = (byTypeMap[r.content_type] || 0) + 1;
    const byType = Object.entries(byTypeMap).map(([content_type, count]) => ({ content_type, count }));

    res.json({
      kpis: { totalCreators: totalCreators||0, totalBusinesses: totalBusinesses||0, totalUsers: totalUsers||0, totalContent: totalContent||0, publishedContent: publishedContent||0, pendingContent: pendingContent||0, last7DaysContent: last7DaysContent||0, suspendedUsers: suspendedUsers||0, pendingQueue: pendingQueue||0, totalOpportunities: totalOpportunities||0 },
      weeklyTrend: [],
      byType,
      isMock: false,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// ── Alerts ──
router.get('/alerts', async (req, res) => {
  try {
    const [{ data: recentContent }, { data: recentUsers }] = await Promise.all([
      supabase.from('content').select('id, title, content_type, created_at, creators!creator_id(name)').order('created_at', { ascending: false }).limit(20),
      supabase.from('creators').select('id, name, role, created_at').order('created_at', { ascending: false }).limit(20),
    ]);
    const contentAlerts = (recentContent || []).map(r => ({ id: r.id, title: r.title, content_type: r.content_type, created_at: r.created_at, creator_name: r.creators?.name, alert_type: 'content' }));
    const userAlerts = (recentUsers || []).map(r => ({ ...r, alert_type: 'user_signup' }));
    const alerts = [...contentAlerts, ...userAlerts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20);
    res.json({ data: alerts, total: alerts.length, isMock: false, note: 'Live alerts derived from recent database activity' });
  } catch (err) { res.status(500).json({ error: 'Failed to load alerts' }); }
});

// ── Change own password ──
router.post('/security/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
    const { data: admin } = await supabase.from('admins').select('*').eq('id', req.user.id).single();
    const valid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await supabase.from('admins').update({ password_hash: hash, updated_at: new Date().toISOString() }).eq('id', req.user.id);
    await supabase.from('audit_log').insert({ action_type: 'admin.password.change', actor: req.user.email, target: `admin:${req.user.id}` });
    res.json({ message: 'Password changed successfully' });
  } catch (err) { res.status(500).json({ error: 'Failed to change password' }); }
});

module.exports = router;
