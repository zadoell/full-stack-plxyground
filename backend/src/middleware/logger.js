// Request logger + error handler middleware

function requestLogger(req, res, next) {
  const start = Date.now();
  const originalEnd = res.end;

  res.end = function (...args) {
    const duration = Date.now() - start;
    const logLine = `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    console.log(logLine);
    originalEnd.apply(res, args);
  };

  next();
}

function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message || err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
  });
}

// Simple counters for observability
const counters = {
  'auth.success': 0,
  'auth.failure': 0,
  'content.create': 0,
  'content.update': 0,
  'content.delete': 0,
  'moderation.action': 0,
};

function incrementCounter(name) {
  if (counters[name] !== undefined) counters[name]++;
}

function getCounters() {
  return { ...counters };
}

module.exports = { requestLogger, errorHandler, incrementCounter, getCounters };
