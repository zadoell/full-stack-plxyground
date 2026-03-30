// Opportunities routes
const express = require('express');
const supabase = require('../db');
const { validatePagination } = require('../middleware/validate');

const router = express.Router();

router.get('/', validatePagination(100), async (req, res) => {
  try {
    const { limit, offset } = req.pagination;
    const { data: rows, count: total, error } = await supabase.from('opportunities').select('*, creators!creator_id(name)', { count: 'exact' }).eq('is_published', true).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw error;
    const flat = (rows || []).map(r => ({ ...r, creator_name: r.creators?.name, creators: undefined }));
    res.json({ data: flat, total: total || 0, page: req.pagination.page, limit });
  } catch (err) { res.status(500).json({ error: 'Failed to list opportunities' }); }
});

module.exports = router;
