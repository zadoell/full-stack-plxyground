// Validation middleware helpers

const ALLOWED_CONTENT_TYPES = ['article', 'video_embed', 'image_story'];

/**
 * Validate URL format (basic check)
 */
function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch { return false; }
}

/**
 * Validate pagination params. Sets req.pagination = { limit, offset, page }
 */
function validatePagination(maxLimit = 100) {
  return (req, res, next) => {
    let limit = parseInt(req.query.limit) || 20;
    let page = parseInt(req.query.page) || 1;
    if (limit < 1) limit = 1;
    if (limit > maxLimit) limit = maxLimit;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;
    req.pagination = { limit, offset, page };
    next();
  };
}

/**
 * Validate content create/update: media_url required, content_type allowlist
 */
function validateContent(req, res, next) {
  const { title, media_url, content_type, body } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required', code: 'VALIDATION_ERROR' });
  }
  if (title.length > 500) {
    return res.status(400).json({ error: 'Title must be under 500 characters', code: 'VALIDATION_ERROR' });
  }
  if (!media_url || typeof media_url !== 'string' || media_url.trim().length === 0) {
    return res.status(400).json({ error: 'Media URL is required', code: 'MEDIA_URL_REQUIRED' });
  }
  if (!isValidUrl(media_url)) {
    return res.status(400).json({ error: 'Media URL must be a valid URL', code: 'VALIDATION_ERROR' });
  }
  if (content_type && !ALLOWED_CONTENT_TYPES.includes(content_type)) {
    return res.status(400).json({ error: `content_type must be one of: ${ALLOWED_CONTENT_TYPES.join(', ')}`, code: 'VALIDATION_ERROR' });
  }
  if (body && body.length > 50000) {
    return res.status(400).json({ error: 'Body must be under 50000 characters', code: 'VALIDATION_ERROR' });
  }

  // Trim inputs
  req.body.title = title.trim();
  req.body.media_url = media_url.trim();
  if (body) req.body.body = body.trim();

  next();
}

module.exports = { validatePagination, validateContent, isValidUrl, ALLOWED_CONTENT_TYPES };
