/**
 * AuthRos — Main Application Server
 * Express.js REST API + Static SaaS Web Application
 * Database: Neon Serverless PostgreSQL (prod) / SQLite3 (local)
 * Auth: JWT Bearer Tokens + RBAC Role Guards
 */

'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { dbQuery, dbRun, getDbInfo, dbEngine } = require('./Database/db');
const { rateLimiter, optionalAuth } = require('./middleware/auth');
const { sanitize } = require('./middleware/validate');

// ─── Route Modules ─────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const pipelineRoutes = require('./routes/pipeline');
const analyticsRoutes = require('./routes/analytics');
const datasetRoutes = require('./routes/datasets');
const auditRoutes = require('./routes/audit');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Global Middleware ──────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Security Headers (Helmet-style, no extra dependency)
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('X-Powered-By', 'AuthRos Biomedical Platform');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logger (Morgan-style, no extra dependency)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const color = res.statusCode >= 500 ? '\x1b[31m' : res.statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    console.log(`${color}[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} +${ms}ms\x1b[0m`);
  });
  next();
});

// Apply rate limiting to all /api routes
app.use('/api', rateLimiter);

// Apply body sanitization to all POST/PATCH routes
app.use(sanitize);

// ─── Static Files ──────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/projects',  projectRoutes);
app.use('/api/pipeline',  pipelineRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/datasets',  datasetRoutes);
app.use('/api/audit',     auditRoutes);
app.use('/api/admin',     adminRoutes);

// ─── Core Platform Endpoints ────────────────────────────────────────────────

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    platform: 'AuthRos Biomedical Research Network',
    version: '3.0.0',
    database_engine: dbEngine === 'neon' ? 'Neon PostgreSQL' : 'Embedded SQLite3',
    uptime_seconds: Math.floor(process.uptime()),
    memory_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    portals: ['Public Donors', 'Hospital Network', 'Research Labs', 'SaaS Dashboard'],
    api_routes: [
      '/api/auth', '/api/projects', '/api/pipeline',
      '/api/analytics', '/api/datasets', '/api/audit', '/api/admin'
    ],
    timestamp: new Date().toISOString()
  });
});

// Database Status & Telemetry
app.get('/api/db/status', async (req, res) => {
  try {
    const dbInfo = getDbInfo();
    const [pc] = await dbQuery('SELECT COUNT(*) as count FROM research_projects');
    const [uc] = await dbQuery('SELECT COUNT(*) as count FROM users');
    const [dc] = await dbQuery('SELECT COUNT(*) as count FROM datasets');
    const [ds] = await dbQuery('SELECT SUM(crowdfunding_raised) as sum FROM research_projects');
    const [ms] = await dbQuery('SELECT COUNT(*) as count FROM milestones');
    const [hc] = await dbQuery('SELECT COUNT(*) as count FROM hospital_cohorts');

    res.json({
      success: true,
      ...dbInfo,
      metrics: {
        total_projects: pc?.count || 0,
        total_users: uc?.count || 0,
        total_datasets: dc?.count || 0,
        total_milestones: ms?.count || 0,
        total_cohorts: hc?.count || 0,
        total_raised_usd: ds?.sum || 0
      },
      server_timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Platform Stats
app.get('/api/stats', async (req, res) => {
  try {
    const [proj] = await dbQuery('SELECT COUNT(*) as count FROM research_projects');
    const [ds] = await dbQuery('SELECT COUNT(*) as count FROM datasets');
    const [don] = await dbQuery('SELECT SUM(crowdfunding_raised) as total FROM research_projects');
    const [hc] = await dbQuery('SELECT COUNT(*) as count FROM hospital_cohorts');
    const [ongoing] = await dbQuery("SELECT COUNT(*) as count FROM research_projects WHERE status='ongoing'");
    const [completed] = await dbQuery("SELECT COUNT(*) as count FROM research_projects WHERE status='completed'");

    res.json({
      success: true,
      data: {
        active_studies: proj?.count || 365,
        ongoing_trials: ongoing?.count || 182,
        completed_papers: completed?.count || 183,
        public_datasets: ds?.count || 0,
        crowdfunding_raised_usd: don?.total || 0,
        hospital_cohorts: hc?.count || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Legacy Compat Endpoints (backwards compatibility) ─────────────────────

// Legacy: GET /api/projects (handled by route module, so only add fallback here)
// Legacy: POST /api/projects/:id/donate — redirect handled by route module
// Legacy: POST /api/projects/:id/cohorts — handled by route module

// ─── Global Error Handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('\x1b[31m[ERROR]\x1b[0m', err.message);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'Invalid JSON body.' });
  }
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'An internal server error occurred.' : err.message
  });
});

// ─── 404 Handler for unknown /api routes ──────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.path}`,
    hint: 'Check /api/health for available routes.'
  });
});

// ─── Catch-All: Serve SaaS Frontend ───────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start Server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const dbInfo = getDbInfo();
  console.log('\n\x1b[32m╔══════════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[32m║         AuthRos Biomedical SaaS Platform v3.0            ║\x1b[0m');
  console.log('\x1b[32m╠══════════════════════════════════════════════════════════╣\x1b[0m');
  console.log(`\x1b[32m║\x1b[0m  Port:         \x1b[36mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`\x1b[32m║\x1b[0m  Database:     \x1b[36m${dbInfo.engine}\x1b[0m`);
  console.log(`\x1b[32m║\x1b[0m  Host:         \x1b[36m${dbInfo.host}\x1b[0m`);
  console.log('\x1b[32m╠══════════════════════════════════════════════════════════╣\x1b[0m');
  console.log('\x1b[32m║\x1b[0m  Frontend:');
  console.log(`\x1b[32m║\x1b[0m    Landing:    \x1b[33mhttp://localhost:${PORT}/index.html\x1b[0m`);
  console.log(`\x1b[32m║\x1b[0m    Dashboard:  \x1b[33mhttp://localhost:${PORT}/dashboard.html\x1b[0m`);
  console.log(`\x1b[32m║\x1b[0m    Auth:       \x1b[33mhttp://localhost:${PORT}/auth.html\x1b[0m`);
  console.log(`\x1b[32m║\x1b[0m    Research:   \x1b[33mhttp://localhost:${PORT}/research.html\x1b[0m`);
  console.log('\x1b[32m╠══════════════════════════════════════════════════════════╣\x1b[0m');
  console.log('\x1b[32m║\x1b[0m  REST API Endpoints:');
  console.log(`\x1b[32m║\x1b[0m    Health:     \x1b[35mGET  /api/health\x1b[0m`);
  console.log(`\x1b[32m║\x1b[0m    Auth:       \x1b[35mPOST /api/auth/login|register\x1b[0m`);
  console.log(`\x1b[32m║\x1b[0m    Projects:   \x1b[35mGET  /api/projects\x1b[0m`);
  console.log(`\x1b[32m║\x1b[0m    Pipeline:   \x1b[35mGET  /api/pipeline\x1b[0m`);
  console.log(`\x1b[32m║\x1b[0m    Analytics:  \x1b[35mGET  /api/analytics/overview\x1b[0m`);
  console.log(`\x1b[32m║\x1b[0m    Datasets:   \x1b[35mGET  /api/datasets\x1b[0m`);
  console.log(`\x1b[32m║\x1b[0m    Audit:      \x1b[35mGET  /api/audit\x1b[0m`);
  console.log(`\x1b[32m║\x1b[0m    Admin:      \x1b[35mGET  /api/admin/stats\x1b[0m`);
  console.log(`\x1b[32m║\x1b[0m    DB Status:  \x1b[35mGET  /api/db/status\x1b[0m`);
  console.log('\x1b[32m╚══════════════════════════════════════════════════════════╝\x1b[0m\n');
});

module.exports = app;
