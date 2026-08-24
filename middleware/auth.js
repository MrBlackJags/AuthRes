/**
 * AuthRos Authentication & Authorization Middleware
 * JWT validation, RBAC role guards, optional auth, and rate limiting
 */

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'authros_biomedical_super_secure_jwt_token_key_2026';

// In-memory rate limiter store (IP → { count, resetAt })
const rateLimitStore = new Map();
const RATE_LIMIT_MAX = 200;          // requests
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * JWT Authentication Middleware — requires valid Bearer token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication token is required. Please sign in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      const message = err.name === 'TokenExpiredError'
        ? 'Session expired. Please sign in again.'
        : 'Invalid or malformed authentication token.';
      return res.status(403).json({ success: false, error: message });
    }
    req.user = decoded;
    next();
  });
}

/**
 * Role-Based Access Control — restrict to specific roles
 * Usage: requireRole('pi', 'scientist')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}.`
      });
    }
    next();
  };
}

/**
 * Optional Authentication — attaches user if token present, proceeds either way
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    req.user = err ? null : decoded;
    next();
  });
}

/**
 * Rate Limiter — 200 requests per 15 minutes per IP
 */
function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  entry.count++;

  if (entry.count > RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.set('Retry-After', retryAfter);
    return res.status(429).json({
      success: false,
      error: `Too many requests. Please wait ${retryAfter} seconds before retrying.`
    });
  }

  next();
}

/**
 * API Key Authentication (alternative to JWT — used for /api/* machine clients)
 */
async function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  if (!apiKey) return next(); // Allow to fall through to JWT check

  try {
    const { dbQuery } = require('../Database/db');
    const rows = await dbQuery('SELECT id, email, full_name, role, tier FROM users WHERE api_key = ?', [apiKey]);
    if (rows && rows.length > 0) {
      req.user = rows[0];
      return next();
    }
  } catch (e) {}

  return res.status(403).json({ success: false, error: 'Invalid API key.' });
}

// Cleanup old rate limit entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) rateLimitStore.delete(ip);
  }
}, 30 * 60 * 1000);

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth,
  rateLimiter,
  authenticateApiKey
};
