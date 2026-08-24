/**
 * AuthRos Request Validation & Sanitization Middleware
 */

/**
 * Sanitizes a single string value — removes HTML tags and trims whitespace
 */
function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Recursively sanitizes all string fields in req.body
 */
function sanitize(req, res, next) {
  function sanitizeObj(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string') clean[k] = sanitizeString(v);
      else if (typeof v === 'object' && v !== null && !Array.isArray(v)) clean[k] = sanitizeObj(v);
      else clean[k] = v;
    }
    return clean;
  }

  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObj(req.body);
  }
  next();
}

/**
 * Field validation middleware factory
 * schema: { fieldName: { required?: boolean, type?: 'string'|'number'|'email', min?: number, max?: number, enum?: string[] } }
 */
function validateBody(schema) {
  return (req, res, next) => {
    const errors = [];
    const body = req.body || {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`Field '${field}' is required.`);
        continue;
      }

      if (value === undefined || value === null || value === '') continue;

      if (rules.type === 'email') {
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(value)) errors.push(`Field '${field}' must be a valid email address.`);
      }

      if (rules.type === 'number') {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`Field '${field}' must be a number.`);
        } else {
          if (rules.min !== undefined && num < rules.min) errors.push(`Field '${field}' must be at least ${rules.min}.`);
          if (rules.max !== undefined && num > rules.max) errors.push(`Field '${field}' must be at most ${rules.max}.`);
        }
      }

      if (rules.type === 'string' && typeof value === 'string') {
        if (rules.min !== undefined && value.length < rules.min) errors.push(`Field '${field}' must be at least ${rules.min} characters.`);
        if (rules.max !== undefined && value.length > rules.max) errors.push(`Field '${field}' must be at most ${rules.max} characters.`);
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`Field '${field}' must be one of: ${rules.enum.join(', ')}.`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join(' '), errors });
    }

    next();
  };
}

/**
 * Pagination parser — attaches req.pagination = { page, limit, offset }
 */
function parsePagination(defaultLimit = 50, maxLimit = 200) {
  return (req, res, next) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit) || defaultLimit));
    const offset = (page - 1) * limit;
    req.pagination = { page, limit, offset };
    next();
  };
}

module.exports = { sanitize, validateBody, parsePagination };
