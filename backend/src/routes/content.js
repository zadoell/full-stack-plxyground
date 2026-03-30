// Content routes – public list/detail + owner CRUD
const express = require('express');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');
const { validatePagination, validateContent } = require('../middleware/validate');
const { incrementCounter } = require('../middleware/logger');

const router = express.Router();

const flatten = r => ({ ...r, creator_name: r.creators?.name, creator_slug: r.creators?.profile_slug, creator_role: r.creators?.role, creators: undefined });

router.get('/', validatePagination(100), async (req, res) => {
  try {
    const { limit, offset } = req.pagination;
    let query = supabase.from('content').select('*, creators!creator_id(name, profile_slug, role)', { count: 'exact' }).eq('is_published', true);
    if (req.query.search) query = query.or(`title.ilike.%${req.query.search}%,body.ilike.%${req.query.search}%`);
    if (req.query.content_type) query = query.eq('content_type', req.query.content_type);
    const { data: rows, count: total, error } = await query.order('feed_rank_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw error;
    res.json({ data: (rows || []).map(flatten), total: total || 0, page: req.pagination.page, limit });
  } catch (err) {
    console.error('List content error:', err);
    res.status(500).json({ error: 'Failed to list content' });
  }
});

router.get('/mine', authenticate, validatePagination(100), async (req, res) => {
  try {
    const { limit, offset } = req.pagination;
    const { data: rows, count: total, error } = await supabase.from('content').select('*, creators!creator_id(name, profile_slug)', { count: 'exact' }).eq('creator_id', req.user.creatorId).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw error;
    res.json({ data: (rows || []).map(flatten), total: total || 0, page: req.pagination.page, limit });
  } catch (err) { res.status(500).json({ error: 'Failed to list your content' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: row, error } = await supabase.from('content').select('*, creators!creator_id(name, profile_slug, role)').eq('id', req.params.id).maybeSingle();
    if (error || !row) return res.status(404).json({ error: 'Content not found' });
    res.json(flatten(row));
  } catch (err) { res.status(500).json({ error: 'Failed to get content' }); }
});

router.post('/', authenticate, validateContent, async (req, res) => {
  try {
    const { title, body, media_url, content_type } = req.body;
    const { data: created, error } = await supabase.from('content').insert({ creator_id: req.user.creatorId, content_type: content_type || 'article', title, body: body || '', media_url, is_published: false }).select().single();
    if (error) throw error;
    await supabase.from('moderation_queue').insert({ type: 'content', status: 'pending', title_or_name: title, submitted_by: req.user.email, entity_id: created.id });
    await supabase.from('audit_log').insert({ action_type: 'content.create', actor: req.user.email, target: `content:${created.id}` });
    incrementCounter('content.create');
    res.status(201).json({ message: 'Content created (pending review)', data: created });
  } catch (err) {
    console.error('Create content error:', err);
    res.status(500).json({ error: 'Failed to create content' });
  }
});

router.put('/:id', authenticate, validateContent, async (req, res) => {
  try {
    const { data: existing } = await supabase.from('content').select('*').eq('id', req.params.id).maybeSingle();
    if (!existing) return res.status(404).json({ error: 'Content not found' });
    if (existing.creator_id !== req.user.creatorId) return res.status(403).json({ error: 'You can only edit your own content' });
    const { title, body, media_url, content_type } = req.body;
    const { data: updated, error } = await supabase.from('content').update({ title, body: body || existing.body, media_url, content_type: content_type || existing.content_type, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw error;
    await supabase.from('audit_log').insert({ action_type: 'content.update', actor: req.user.email, target: `content:${req.params.id}`, before_snapshot: JSON.stringify(existing) });
    incrementCounter('content.update');
    res.json({ message: 'Content updated', data: updated });
  } catch (err) {
    console.error('Update content error:', err);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { data: existing } = await supabase.from('content').select('*').eq('id', req.params.id).maybeSingle();
    if (!existing) return res.status(404).json({ error: 'Content not found' });
    if (existing.creator_id !== req.user.creatorId) return res.status(403).json({ error: 'You can only delete your own content' });
    await supabase.from('content').delete().eq('id', req.params.id);
    await supabase.from('moderation_queue').delete().eq('entity_id', req.params.id).eq('type', 'content');
    await supabase.from('audit_log').insert({ action_type: 'content.delete', actor: req.user.email, target: `content:${req.params.id}`, before_snapshot: JSON.stringify(existing) });
    incrementCounter('content.delete');
    res.json({ message: 'Content deleted' });
  } catch (err) {
    console.error('Delete content error:', err);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

module.exports = router;
