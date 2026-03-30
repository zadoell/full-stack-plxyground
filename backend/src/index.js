// PLXYGROUND Backend Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { requestLogger, errorHandler, getCounters } = require('./middleware/logger');

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required.');
  process.exit(1);
}

const app = express();
const PORT = parseInt(process.env.PORT) || 3011;

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
}));

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
if (allowedOrigins.length === 0 && process.env.NODE_ENV === 'production') {
  console.error('FATAL: CORS_ORIGIN environment variable is required in production.');
  process.exit(1);
}
app.use(cors({ origin: allowedOrigins.length > 0 ? allowedOrigins : '*', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(requestLogger);

const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 50, message: { error: 'Too many requests, please try again later', code: 'RATE_LIMITED' }, standardHeaders: true, legacyHeaders: false });
const contentLimiter = rateLimit({ windowMs: 15*60*1000, max: 100, message: { error: 'Too many requests', code: 'RATE_LIMITED' }, standardHeaders: true, legacyHeaders: false });
const generalLimiter = rateLimit({ windowMs: 15*60*1000, max: 200, message: { error: 'Too many requests', code: 'RATE_LIMITED' }, standardHeaders: true, legacyHeaders: false });
const uploadLimiter = rateLimit({ windowMs: 15*60*1000, max: 30, message: { error: 'Too many upload requests', code: 'RATE_LIMITED' }, standardHeaders: true, legacyHeaders: false });

app.get('/', (_req, res) => res.json({ status: 'ok', service: 'PLXYGROUND API', version: '1.0.0' }));

app.get('/healthz', async (_req, res) => {
  let dbStatus = 'unknown';
  try {
    const supabase = require('./db');
    const { error } = await supabase.from('admins').select('id', { count: 'exact', head: true });
    dbStatus = error ? 'error' : 'connected';
  } catch { dbStatus = 'error'; }
  const healthy = dbStatus === 'connected';
  res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', uptime: process.uptime(), db: dbStatus, env: process.env.NODE_ENV || 'development', counters: getCounters() });
});

const authRoutes = require('./routes/auth');
const creatorRoutes = require('./routes/creators');
const contentRoutes = require('./routes/content');
const opportunityRoutes = require('./routes/opportunities');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/business/auth/signup', authLimiter, (req, res) => { req.url = '/business/signup'; authRoutes.handle(req, res); });
app.use('/api/business/auth/login', authLimiter, (req, res) => { req.url = '/business/login'; authRoutes.handle(req, res); });
app.use('/api/fan/auth/signup', authLimiter, (req, res) => { req.url = '/fan/signup'; authRoutes.handle(req, res); });
app.use('/api/fan/auth/login', authLimiter, (req, res) => { req.url = '/fan/login'; authRoutes.handle(req, res); });
app.use('/api/athlete/auth/signup', authLimiter, (req, res) => { req.url = '/athlete/signup'; authRoutes.handle(req, res); });
app.use('/api/athlete/auth/login', authLimiter, (req, res) => { req.url = '/athlete/login'; authRoutes.handle(req, res); });
app.use('/api/creators', generalLimiter, creatorRoutes);
app.use('/api/content', contentLimiter, contentRoutes);
app.use('/api/opportunities', generalLimiter, opportunityRoutes);
app.use('/api/notifications', generalLimiter, notificationRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/admin', adminRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' }));
app.use(errorHandler);

if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

// In Vercel serverless, skip listen – the exported app is used directly.
let server;
if (!process.env.VERCEL) {
  server = app.listen(PORT, () => {
    console.log(`\n🏟️  PLXYGROUND Backend running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/healthz`);
    console.log(`   ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   CORS origins: ${allowedOrigins.join(', ') || '*'}\n`);
  });
}

function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  if (server) server.close(() => { console.log('HTTP server closed.'); process.exit(0); });
  else process.exit(0);
  setTimeout(() => { console.error('Forced shutdown after timeout.'); process.exit(1); }, 10000);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
