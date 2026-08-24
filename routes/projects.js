/**
 * AuthRos — Projects Routes (full CRUD + milestones, datasets, cohorts, donations, members)
 */

const router = require('express').Router();
const { dbQuery, dbRun } = require('../Database/db');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');
const { validateBody, sanitize, parsePagination } = require('../middleware/validate');

// ─── HELPERS ───────────────────────────────────────────────────────────────
function makeId(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`; }

// ─── GET /api/projects ──────────────────────────────────────────────────────
router.get('/', optionalAuth, parsePagination(50, 2000), async (req, res) => {
  try {
    const { q, stage, status, visibility, domain, country, publisher, era } = req.query;
    const { limit, offset } = req.pagination;

    let sql = `
      SELECT p.*, u.full_name as lead_name, o.name as org_name
      FROM research_projects p
      LEFT JOIN users u ON p.lead_investigator_id = u.id
      LEFT JOIN organizations o ON p.organization_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      sql += ` AND (LOWER(p.title) LIKE ? OR LOWER(p.summary) LIKE ? OR LOWER(p.code) LIKE ?
               OR LOWER(u.full_name) LIKE ? OR LOWER(p.journal_citation) LIKE ?
               OR LOWER(p.country_name) LIKE ? OR LOWER(p.publisher_name) LIKE ?)`;
      const t = `%${q.toLowerCase()}%`;
      params.push(t, t, t, t, t, t, t);
    }
    if (status && status !== 'all') { sql += ` AND p.status = ?`; params.push(status); }
    if (stage && stage !== 'all') { sql += ` AND p.stage = ?`; params.push(stage); }
    if (visibility && visibility !== 'all') { sql += ` AND p.visibility = ?`; params.push(visibility); }
    if (domain && domain !== 'all') { sql += ` AND LOWER(p.domain) LIKE ?`; params.push(`%${domain.toLowerCase()}%`); }
    if (country && country !== 'all') {
      sql += ` AND (p.country_code = ? OR LOWER(p.country_name) = ?)`;
      params.push(country.toUpperCase(), country.toLowerCase());
    }
    if (publisher && publisher !== 'all') {
      sql += ` AND LOWER(p.publisher_name) LIKE ?`;
      params.push(`%${publisher.toLowerCase()}%`);
    }
    if (era && era !== 'all') {
      if (era === 'historic') sql += ` AND p.publication_year < 1980`;
      else if (era === 'modern') sql += ` AND p.publication_year BETWEEN 1980 AND 2015`;
      else if (era === 'contemporary') sql += ` AND p.publication_year >= 2016`;
    }

    // Count total before pagination
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) t`;
    const countRes = await dbQuery(countSql, params).catch(() => [{ total: 0 }]);
    const total = countRes[0]?.total || 0;

    sql += ` ORDER BY p.publication_year DESC, p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await dbQuery(sql, params);
    res.json({ success: true, count: rows.length, total, page: req.pagination.page, limit, projects: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/projects/:id ──────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await dbQuery(`
      SELECT p.*, u.full_name as lead_name, u.email as lead_email, o.name as org_name
      FROM research_projects p
      LEFT JOIN users u ON p.lead_investigator_id = u.id
      LEFT JOIN organizations o ON p.organization_id = o.id
      WHERE p.id = ?
    `, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Research project not found.' });
    }

    const project = rows[0];
    const milestones = await dbQuery('SELECT * FROM milestones WHERE project_id = ? ORDER BY order_index ASC', [id]);
    const datasets = await dbQuery('SELECT * FROM datasets WHERE project_id = ? ORDER BY created_at DESC', [id]);
    const donations = await dbQuery('SELECT * FROM donations WHERE project_id = ? ORDER BY created_at DESC', [id]);
    const cohorts = await dbQuery('SELECT * FROM hospital_cohorts WHERE project_id = ? ORDER BY created_at DESC', [id]);
    const members = await dbQuery(`
      SELECT pm.*, u.full_name, u.email, u.title
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `, [id]);

    res.json({ success: true, project, milestones, datasets, donations, cohorts, members });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/projects ─────────────────────────────────────────────────────
router.post('/', authenticateToken, sanitize, validateBody({
  title: { required: true, type: 'string', min: 5, max: 500 },
  summary: { required: true, type: 'string', min: 20, max: 5000 },
  stage: { required: true, enum: ['discovery', 'preclinical', 'phase_1', 'phase_2', 'phase_3'] }
}), async (req, res) => {
  try {
    const { title, summary, stage, visibility, domain, crowdfunding_target, journal_citation, doi, source_url } = req.body;
    const id = makeId('proj');
    const code = 'AR-' + Math.floor(100 + Math.random() * 900) + '-' + (domain || 'BIO').toUpperCase().substring(0, 3);

    await dbRun(`
      INSERT INTO research_projects
        (id, title, code, summary, status, stage, visibility, domain, progress_percent,
         crowdfunding_raised, crowdfunding_target, lead_investigator_id, organization_id,
         publication_year, journal_citation, doi, source_url)
      VALUES (?, ?, ?, ?, 'ongoing', ?, ?, ?, 5, 0, ?, ?, 'org-1', ?, ?, ?, ?)
    `, [id, title, code, summary, stage, visibility || 'public', domain || 'biomedical',
        crowdfunding_target || 50000, req.user.id, new Date().getFullYear(),
        journal_citation || null, doi || null, source_url || null]);

    await dbRun('INSERT INTO audit_logs (id, action, actor_id, project_id, details) VALUES (?, ?, ?, ?, ?)',
      [makeId('audit'), 'PROJECT_CREATE', req.user.id, id, `Created project "${title}"`]).catch(() => {});

    res.status(201).json({ success: true, message: 'Research protocol created!', data: { id, code } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PATCH /api/projects/:id ────────────────────────────────────────────────
router.patch('/:id', authenticateToken, requireRole('pi', 'scientist'), sanitize, async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['title', 'summary', 'stage', 'visibility', 'domain', 'crowdfunding_target',
                     'progress_percent', 'journal_citation', 'doi', 'source_url', 'abstract', 'status'];
    const updates = [];
    const params = [];

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }

    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields to update.' });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await dbRun(`UPDATE research_projects SET ${updates.join(', ')} WHERE id = ?`, params);
    await dbRun('INSERT INTO audit_logs (id, action, actor_id, project_id, details) VALUES (?, ?, ?, ?, ?)',
      [makeId('audit'), 'PROJECT_UPDATE', req.user.id, id, `Updated: ${Object.keys(req.body).join(', ')}`]).catch(() => {});

    res.json({ success: true, message: 'Project updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DELETE /api/projects/:id ───────────────────────────────────────────────
router.delete('/:id', authenticateToken, requireRole('pi'), async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await dbQuery('SELECT id, title FROM research_projects WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ success: false, error: 'Project not found.' });

    await dbRun('DELETE FROM research_projects WHERE id = ?', [id]);
    await dbRun('INSERT INTO audit_logs (id, action, actor_id, details) VALUES (?, ?, ?, ?)',
      [makeId('audit'), 'PROJECT_DELETE', req.user.id, `Deleted project ${id}: "${rows[0].title}"`]).catch(() => {});

    res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── LIKE ───────────────────────────────────────────────────────────────────
router.post('/:id/like', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const action = req.body?.action || 'like';
    const delta = action === 'unlike' ? -1 : 1;
    await dbRun('UPDATE research_projects SET likes_count = MAX(0, likes_count + ?) WHERE id = ?', [delta, id]);
    const updated = await dbQuery('SELECT likes_count FROM research_projects WHERE id = ?', [id]);
    res.json({ success: true, likes_count: updated[0]?.likes_count || 0 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── MILESTONES ─────────────────────────────────────────────────────────────
router.get('/:id/milestones', optionalAuth, async (req, res) => {
  try {
    const rows = await dbQuery('SELECT * FROM milestones WHERE project_id = ? ORDER BY order_index ASC', [req.params.id]);
    res.json({ success: true, count: rows.length, milestones: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/milestones', authenticateToken, requireRole('pi', 'scientist'), validateBody({
  title: { required: true, type: 'string', min: 3 }
}), async (req, res) => {
  try {
    const { title, description, order_index } = req.body;
    const id = makeId('ms');
    const countRes = await dbQuery('SELECT COUNT(*) as c FROM milestones WHERE project_id = ?', [req.params.id]);
    const idx = order_index !== undefined ? order_index : (countRes[0]?.c || 0) + 1;
    await dbRun('INSERT INTO milestones (id, project_id, title, description, order_index) VALUES (?, ?, ?, ?, ?)',
      [id, req.params.id, title, description || '', idx]);
    res.status(201).json({ success: true, message: 'Milestone added.', data: { id } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:id/milestones/:mid', authenticateToken, requireRole('pi', 'scientist', 'tech'), async (req, res) => {
  try {
    const { is_completed, title, description } = req.body;
    const completedAt = is_completed ? 'CURRENT_TIMESTAMP' : 'NULL';

    let sql = `UPDATE milestones SET`;
    const updates = [];
    const params = [];
    if (title !== undefined) { updates.push(' title = ?'); params.push(title); }
    if (description !== undefined) { updates.push(' description = ?'); params.push(description); }
    if (is_completed !== undefined) {
      updates.push(` is_completed = ?`); params.push(is_completed ? 1 : 0);
      updates.push(` completed_at = ${is_completed ? 'CURRENT_TIMESTAMP' : 'NULL'}`);
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields to update.' });
    params.push(req.params.mid);
    await dbRun(`${sql} ${updates.join(',')} WHERE id = ?`, params);

    // Recalculate project progress
    const msAll = await dbQuery('SELECT is_completed FROM milestones WHERE project_id = ?', [req.params.id]);
    if (msAll && msAll.length > 0) {
      const done = msAll.filter(m => m.is_completed).length;
      const pct = Math.round((done / msAll.length) * 100);
      await dbRun('UPDATE research_projects SET progress_percent = ? WHERE id = ?', [pct, req.params.id]).catch(() => {});
    }

    res.json({ success: true, message: 'Milestone updated.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DATASETS ───────────────────────────────────────────────────────────────
router.get('/:id/datasets', optionalAuth, async (req, res) => {
  try {
    const isAuth = Boolean(req.user);
    let sql = 'SELECT * FROM datasets WHERE project_id = ?';
    if (!isAuth) sql += ` AND visibility = 'public'`;
    sql += ' ORDER BY created_at DESC';
    const rows = await dbQuery(sql, [req.params.id]);
    res.json({ success: true, count: rows.length, datasets: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/datasets', authenticateToken, requireRole('pi', 'scientist', 'tech'), validateBody({
  file_name: { required: true, type: 'string' },
  file_url: { required: true, type: 'string' }
}), async (req, res) => {
  try {
    const { file_name, file_url, file_type, file_size, visibility } = req.body;
    const id = makeId('ds');
    await dbRun('INSERT INTO datasets (id, project_id, file_name, file_url, file_type, file_size, visibility, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.params.id, file_name, file_url, file_type || 'csv', file_size || 'Unknown', visibility || 'public', req.user.id]);
    res.status(201).json({ success: true, message: 'Dataset registered.', data: { id } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── COHORTS ────────────────────────────────────────────────────────────────
router.get('/:id/cohorts', authenticateToken, requireRole('pi', 'scientist', 'hospital'), async (req, res) => {
  try {
    const rows = await dbQuery('SELECT * FROM hospital_cohorts WHERE project_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.json({ success: true, count: rows.length, cohorts: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/cohorts', authenticateToken, requireRole('pi', 'hospital'), validateBody({
  hospital_name: { required: true, type: 'string' },
  patient_count: { required: true, type: 'number', min: 1 }
}), async (req, res) => {
  try {
    const { hospital_name, patient_count, biomarker_target, deidentified_summary } = req.body;
    const id = makeId('hc');
    const hash = '0x' + Math.random().toString(16).substring(2, 14).toUpperCase();
    await dbRun('INSERT INTO hospital_cohorts (id, project_id, hospital_name, patient_count, biomarker_target, deidentified_summary, verification_hash) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.params.id, hospital_name, patient_count, biomarker_target || 'Unspecified', deidentified_summary || '', hash]);
    res.status(201).json({ success: true, message: 'Cohort submitted successfully!', data: { id, hash } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DONATIONS ───────────────────────────────────────────────────────────────
router.get('/:id/donations', optionalAuth, async (req, res) => {
  try {
    const rows = await dbQuery('SELECT * FROM donations WHERE project_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.json({ success: true, count: rows.length, donations: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/donate', optionalAuth, validateBody({
  amount: { required: true, type: 'number', min: 1 }
}), async (req, res) => {
  try {
    const { amount, donor_name } = req.body;
    const id = makeId('don');
    await dbRun('INSERT INTO donations (id, project_id, donor_name, amount) VALUES (?, ?, ?, ?)',
      [id, req.params.id, donor_name || 'Anonymous Supporter', amount]);
    await dbRun('UPDATE research_projects SET crowdfunding_raised = crowdfunding_raised + ? WHERE id = ?', [amount, req.params.id]);
    res.json({ success: true, message: 'Donation received! Thank you for supporting science.', data: { id } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── TEAM MEMBERS ────────────────────────────────────────────────────────────
router.get('/:id/members', authenticateToken, async (req, res) => {
  try {
    const rows = await dbQuery(`
      SELECT pm.*, u.full_name, u.email, u.title, u.role as user_role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `, [req.params.id]);
    res.json({ success: true, count: rows.length, members: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/members', authenticateToken, requireRole('pi'), validateBody({
  user_id: { required: true, type: 'string' },
  role_level: { required: true, enum: ['pi', 'scientist', 'tech', 'hospital'] }
}), async (req, res) => {
  try {
    const { user_id, role_level, permissions_json } = req.body;
    const id = makeId('pm');
    const defaultPerms = { pi: ['all'], scientist: ['datasets', 'milestones'], tech: ['upload', 'log'], hospital: ['cohort'] };
    const perms = permissions_json || JSON.stringify(defaultPerms[role_level] || []);
    await dbRun('INSERT OR REPLACE INTO project_members (id, project_id, user_id, role_level, permissions_json) VALUES (?, ?, ?, ?, ?)',
      [id, req.params.id, user_id, role_level, typeof perms === 'string' ? perms : JSON.stringify(perms)]);
    res.status(201).json({ success: true, message: 'Team member added.', data: { id } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id/members/:uid', authenticateToken, requireRole('pi'), async (req, res) => {
  try {
    await dbRun('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [req.params.id, req.params.uid]);
    res.json({ success: true, message: 'Team member removed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
