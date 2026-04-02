// Upload route – accepts image/video files, stores in Supabase Storage
const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const BUCKET = 'media';

// Multer config – store in memory (we forward to Supabase Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    // Reject SVG – it can contain embedded scripts (XSS risk)
    const allowed = /^(image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|webm|quicktime|mov))$/i;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, GIF, WebP, MP4, WebM, MOV`));
    }
  },
});

// ── POST /api/upload – upload a single file ──
router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided. Send a file with field name "file".' });
    }

    const ext = path.extname(req.file.originalname) || '.bin';
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const storagePath = `uploads/${req.user.creatorId || req.user.id}/${uniqueName}`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadErr) {
      console.error('Supabase Storage upload error:', uploadErr);
      return res.status(500).json({ error: 'Upload failed: ' + uploadErr.message });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    await supabase.from('audit_log').insert({
      action_type: 'file.upload',
      actor: req.user.email || `user:${req.user.creatorId || req.user.id}`,
      target: storagePath,
      metadata: JSON.stringify({ originalName: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype }),
    });

    res.json({
      message: 'File uploaded successfully',
      url: urlData.publicUrl,
      path: storagePath,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// Multer error handler
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 10 MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;
