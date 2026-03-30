// Creator routes
const express = require('express');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validate');

const router = express.Router();

router.get('/', validatePagination(100), async (req, res) => {
  try {
    const { limit, offset } = req.pagination;
    let query = supabase.from('creators').select('*, creator_accounts!creator_id(email)', { count: 'exact' }).eq('is_active', true);
    if (req.query.search) query = query.or(`name.ilike.%${req.query.search}%,bio.ilike.%${req.query.search}%,location.ilike.%${req.query.search}%`);
    if (req.query.role) query = query.eq('role', req.query.role);
    const { data: rows, count: total, error } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw error;
    const flat = (rows || []).map(r => { const a = Array.isArray(r.creator_accounts) ? r.creator_accounts[0] : r.creator_accounts; return { ...r, email: a?.email, creator_accounts: undefined }; });
    res.json({ data: flat, total: total || 0, page: req.pagination.page, limit });
  } catch (err) {
    console.error('List creators error:', err);
    res.status(500).json({ error: 'Failed to list creators' });
  }
});

router.get('/slug/:slug', async (req, res) => {
  try {
    const { data: row, error } = await supabase.from('creators').select('*, creator_accounts!creator_id(email)').eq('profile_slug', req.params.slug).maybeSingle();
    if (error || !row) return res.status(404).json({ error: 'Creator not found' });
    const a = Array.isArray(row.creator_accounts) ? row.creator_accounts[0] : row.creator_accounts;
    res.json({ ...row, email: a?.email, creator_accounts: undefined });
  } catch (err) { res.status(500).json({ error: 'Failed to get creator' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: row, error } = await supabase.from('creators').select('*, creator_accounts!creator_id(email)').eq('id', req.params.id).maybeSingle();
    if (error || !row) return res.status(404).json({ error: 'Creator not found' });
    const a = Array.isArray(row.creator_accounts) ? row.creator_accounts[0] : row.creator_accounts;
    res.json({ ...row, email: a?.email, creator_accounts: undefined });
  } catch (err) { res.status(500).json({ error: 'Failed to get creator' }); }
});

router.put('/me', authenticate, async (req, res) => {
  try {
    const { bio, location, social_links, name } = req.body;
    if (social_links && typeof social_links === 'string') {
      try { JSON.parse(social_links); } catch { return res.status(400).json({ error: 'social_links must be valid JSON' }); }
    }
    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (location !== undefined) updates.location = location.trim();
    if (social_links !== undefined) updates.social_links = typeof social_links === 'string' ? JSON.parse(social_links) : social_links;
    if (Object.keys(updates).length === 1) return res.status(400).json({ error: 'No fields to update' });
    const { data: updated, error } = await supabase.from('creators').update(updates).eq('id', req.user.creatorId).select().single();
    if (error) throw error;
    res.json({ message: 'Profile updated', data: updated });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
