/**
 * AuthRos — Datasets Routes
 * GET    /api/datasets          — All public datasets
 * GET    /api/datasets/:id      — Single dataset
 * DELETE /api/datasets/:id      — Delete a dataset (PI/scientist only)
 */

const router = require('express').Router();
const { dbQuery, dbRun } = require('../Database/db');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const { parsePagination } = require('../middleware/validate');

// GET /api/datasets — All public datasets
router.get('/', optionalAuth, parsePagination(50, 200), async (req, res) => {
  try {
    const { project_id, file_type, q } = req.query;
    const { limit, offset } = req.pagination;

    const isAuth = Boolean(req.user);
    let sql = `
      SELECT d.*, p.title as project_title, p.code as project_code, u.full_name as uploader_name
      FROM datasets d
      LEFT JOIN research_projects p ON d.project_id = p.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // Non-authenticated users only see public datasets
    if (!isAuth) {
      sql += ` AND d.visibility = 'public'`;
    }

    if (project_id) {
      sql += ` AND d.project_id = ?`; params.push(project_id);
    }
    if (file_type) {
      sql += ` AND LOWER(d.file_type) = ?`; params.push(file_type.toLowerCase());
    }
    if (q) {
      sql += ` AND LOWER(d.file_name) LIKE ?`; params.push(`%${q.toLowerCase()}%`);
    }

    sql += ` ORDER BY d.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await dbQuery(sql, params);
    res.json({ success: true, count: rows.length, datasets: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/datasets/:id — Single dataset
router.get('/:id', async (req, res) => {
  try {
    const rows = await dbQuery(`
      SELECT d.*, p.title as project_title, p.code as project_code
      FROM datasets d
      LEFT JOIN research_projects p ON d.project_id = p.id
      WHERE d.id = ?
    `, [req.params.id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dataset not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/datasets/:id — Remove a dataset (PI or Scientist)
router.delete('/:id', authenticateToken, requireRole('pi', 'scientist'), async (req, res) => {
  try {
    const rows = await dbQuery('SELECT id FROM datasets WHERE id = ?', [req.params.id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dataset not found.' });
    }

    await dbRun('DELETE FROM datasets WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Dataset removed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
