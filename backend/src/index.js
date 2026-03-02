// PLXYGROUND Backend Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { requestLogger, errorHandler, getCounters } = require('./middleware/logger');

// Validate critical env
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required.');
  process.exit(1);
}

const app = express();
const PORT = parseInt(process.env.PORT) || 3011;

// ── Security & Parsing ──
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  credentials: true,
}));

// Body size limits
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Request logging
app.use(requestLogger);

// ── Rate Limiting ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many requests, please try again later', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

const contentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests', code: 'RATE_LIMITED' },
});

// ── Health Check ──
app.get('/', (_req, res) => res.json({ status: 'ok', service: 'PLXYGROUND API', version: '1.0.0' }));
app.get('/healthz', (_req, res) => res.json({ status: 'ok', uptime: process.uptime(), counters: getCounters() }));

// ── Routes ──
const authRoutes = require('./routes/auth');
const creatorRoutes = require('./routes/creators');
const contentRoutes = require('./routes/content');
const opportunityRoutes = require('./routes/opportunities');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/business/auth/signup', authLimiter, (req, res) => {
  // Forward to auth business signup
  req.url = '/business/signup';
  authRoutes.handle(req, res);
});
app.use('/api/business/auth/login', authLimiter, (req, res) => {
  req.url = '/business/login';
  authRoutes.handle(req, res);
});
app.use('/api/creators', creatorRoutes);
app.use('/api/content', contentLimiter, contentRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/admin', adminRoutes);

// ── 404 ──
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
});

// ── Error handler ──
app.use(errorHandler);

// ── Start ──
app.listen(PORT, () => {
  console.log(`\n🏟️  PLXYGROUND Backend running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/healthz`);
  console.log(`   CORS origins: ${allowedOrigins.join(', ') || '*'}\n`);
});

module.exports = app;
