// Notification routes
const express = require('express');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// ── Get notifications ──
router.get('/', async (req, res) => {
  try {
    const userId = req.user.creatorId;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    const { count, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (countError) throw countError;

    res.json({ data: notifications || [], unread_count: count || 0 });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications', code: 'INTERNAL_ERROR' });
  }
});

// ── Mark notification as read ──
router.put('/:id/read', async (req, res) => {
  try {
    const userId = req.user.creatorId;
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Notification not found', code: 'NOT_FOUND' });
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to update notification', code: 'INTERNAL_ERROR' });
  }
});

// ── Mark all notifications as read ──
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user.creatorId;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Failed to update notifications', code: 'INTERNAL_ERROR' });
  }
});

module.exports = router;
