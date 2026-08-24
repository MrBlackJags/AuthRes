/**
 * AuthRos — Pipeline Routes
 * GET  /api/pipeline           — All active clinical pipeline projects with stage info
 * GET  /api/pipeline/stages    — Stage summary counts
 * GET  /api/pipeline/domains   — Domain breakdown stats
 * GET  /api/pipeline/timeline  — Papers by publication year
 * POST /api/pipeline/submit    — Submit a project to the pipeline
 */

const router = require('express').Router();
const { dbQuery, dbRun, dbGet } = require('../Database/db');
const { optionalAuth, authenticateToken, requireRole } = require('../middleware/auth');
const { validateBody, parsePagination } = require('../middleware/validate');

// GET /api/pipeline — Active clinical pipeline (ongoing studies)
router.get('/', optionalAuth, parsePagination(50, 200), async (req, res) => {
  try {
    const { stage, domain, country, q } = req.query;
    const { limit, offset } = req.pagination;

    let sql = `
      SELECT p.*, u.full_name as lead_name, o.name as org_name
      FROM research_projects p
      LEFT JOIN users u ON p.lead_investigator_id = u.id
      LEFT JOIN organizations o ON p.organization_id = o.id
      WHERE p.status = 'ongoing'
    `;
    const params = [];

    if (stage && stage !== 'all') {
      sql += ' AND p.stage = ?'; params.push(stage);
    }
    if (domain && domain !== 'all') {
      sql += ' AND LOWER(p.domain) LIKE ?'; params.push(`%${domain.toLowerCase()}%`);
    }
    if (country && country !== 'all') {
      sql += ' AND (p.country_code = ? OR LOWER(p.country_name) = ?)';
      params.push(country.toUpperCase(), country.toLowerCase());
    }
    if (q) {
      sql += ' AND (LOWER(p.title) LIKE ? OR LOWER(p.summary) LIKE ? OR LOWER(p.domain) LIKE ?)';
      const t = `%${q.toLowerCase()}%`;
      params.push(t, t, t);
    }

    sql += ' ORDER BY p.publication_year DESC, p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await dbQuery(sql, params);

    // Count total for pagination
    let countSql = `SELECT COUNT(*) as total FROM research_projects p WHERE p.status = 'ongoing'`;
    if (stage && stage !== 'all') countSql += ` AND p.stage = '${stage.replace(/'/g, "''")}'`;
    const countRes = await dbQuery(countSql, []);
    const total = countRes[0]?.total || 0;

    res.json({
      success: true,
      count: rows.length,
      total,
      page: req.pagination.page,
      limit,
      projects: rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/pipeline/stages — Stage summary counts
router.get('/stages', async (req, res) => {
  try {
    const stages = ['discovery', 'preclinical', 'phase_1', 'phase_2', 'phase_3', 'completed'];
    const rows = await dbQuery(`
      SELECT stage, COUNT(*) as count, SUM(crowdfunding_raised) as total_raised
      FROM research_projects
      GROUP BY stage
    `);

    const stageMap = {};
    rows.forEach(r => { stageMap[r.stage] = r; });

    const stageLabels = {
      discovery: 'Discovery', preclinical: 'Preclinical',
      phase_1: 'Phase I', phase_2: 'Phase II',
      phase_3: 'Phase III', completed: 'Published'
    };

    const summary = stages.map(s => ({
      stage: s,
      label: stageLabels[s] || s,
      count: stageMap[s]?.count || 0,
      total_raised: stageMap[s]?.total_raised || 0
    }));

    res.json({ success: true, stages: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/pipeline/domains — Domain breakdown statistics
router.get('/domains', async (req, res) => {
  try {
    const rows = await dbQuery(`
      SELECT domain,
             COUNT(*) as total,
             SUM(CASE WHEN status = 'ongoing' THEN 1 ELSE 0 END) as ongoing,
             SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
             AVG(crowdfunding_raised) as avg_raised
      FROM research_projects
      GROUP BY domain
      ORDER BY total DESC
    `);

    res.json({ success: true, count: rows.length, domains: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/pipeline/timeline — Papers by publication year
router.get('/timeline', async (req, res) => {
  try {
    const rows = await dbQuery(`
      SELECT publication_year as year,
             COUNT(*) as total,
             SUM(CASE WHEN status = 'ongoing' THEN 1 ELSE 0 END) as ongoing,
             SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM research_projects
      WHERE publication_year IS NOT NULL
      GROUP BY publication_year
      ORDER BY publication_year ASC
    `);

    res.json({ success: true, count: rows.length, timeline: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/pipeline/submit — Submit new pipeline entry (requires auth)
router.post('/submit', authenticateToken, validateBody({
  title: { required: true, type: 'string', min: 5, max: 500 },
  summary: { required: true, type: 'string', min: 20, max: 5000 },
  stage: { required: true, enum: ['discovery', 'preclinical', 'phase_1', 'phase_2', 'phase_3'] },
  domain: { required: true, type: 'string', min: 2, max: 100 }
}), async (req, res) => {
  try {
    const { title, summary, stage, domain, visibility, crowdfunding_target } = req.body;
    const userId = req.user.id;

    const id = 'proj-' + Date.now();
    const code = 'AR-' + Math.floor(100 + Math.random() * 900) + '-' + domain.toUpperCase().substring(0, 3);

    await dbRun(`
      INSERT INTO research_projects
        (id, title, code, summary, status, stage, visibility, domain, progress_percent,
         crowdfunding_raised, crowdfunding_target, lead_investigator_id, organization_id, publication_year)
      VALUES (?, ?, ?, ?, 'ongoing', ?, ?, ?, 5, 0, ?, ?, 'org-1', ?)
    `, [id, title, code, summary, stage, visibility || 'public', domain,
        crowdfunding_target || 50000, userId, new Date().getFullYear()]);

    // Log audit
    const auditId = 'audit-' + Date.now();
    await dbRun(
      'INSERT INTO audit_logs (id, project_id, action, actor_id, details) VALUES (?, ?, ?, ?, ?)',
      [auditId, id, 'PIPELINE_SUBMIT', userId, `Submitted "${title}" to pipeline as ${stage}`]
    ).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Research protocol submitted to pipeline successfully!',
      data: { id, code }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
