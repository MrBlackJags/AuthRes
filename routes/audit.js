/**
 * AuthRos — Audit Log Routes
 * GET  /api/audit         — Paginated audit log (authenticated)
 * POST /api/audit         — Log an action (authenticated)
 */

const router = require('express').Router();
const { dbQuery, dbRun } = require('../Database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { parsePagination } = require('../middleware/validate');

// GET /api/audit — Paginated audit log
router.get('/', authenticateToken, parsePagination(50, 200), async (req, res) => {
  try {
    const { project_id } = req.query;
    const { limit, offset } = req.pagination;

    let sql = `
      SELECT a.*, u.full_name as actor_name, u.role as actor_role, p.title as project_title, p.code as project_code
      FROM audit_logs a
      LEFT JOIN users u ON a.actor_id = u.id
      LEFT JOIN research_projects p ON a.project_id = p.id
      WHERE 1=1
    `;
    const params = [];

    // PI can see all; others see only their own project logs
    if (req.user.role !== 'pi') {
      // Find projects this user leads
      sql += ` AND (a.actor_id = ? OR a.project_id IN (
        SELECT id FROM research_projects WHERE lead_investigator_id = ?
      ))`;
      params.push(req.user.id, req.user.id);
    }

    if (project_id) {
      sql += ` AND a.project_id = ?`; params.push(project_id);
    }

    sql += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await dbQuery(sql, params);

    // Count for pagination
    const countRes = await dbQuery(`SELECT COUNT(*) as total FROM audit_logs`, []);
    const total = countRes[0]?.total || 0;

    res.json({
      success: true,
      count: rows.length,
      total,
      page: req.pagination.page,
      limit,
      logs: rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/audit — Log an action
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { action, project_id, details } = req.body;
    if (!action) return res.status(400).json({ success: false, error: 'Action is required.' });

    const id = 'audit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    await dbRun(
      'INSERT INTO audit_logs (id, project_id, action, actor_id, details) VALUES (?, ?, ?, ?, ?)',
      [id, project_id || null, action, req.user.id, details || '']
    );

    res.status(201).json({ success: true, message: 'Audit event logged.', id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
