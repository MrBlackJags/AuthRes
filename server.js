/**
 * BioTrack REST API & Web Application Server
 * Framework: Express.js + SQLite3
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Public Static Files cleanly
app.use(express.static(path.join(__dirname, 'public')));

// SQLite Database Setup
const dbPath = path.join(__dirname, 'Database', 'biotrack.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open Database file. Run "npm run seed" first.', err.message);
  } else {
    console.log('BioTrack API connected to SQLite Database:', dbPath);
  }
});

// Helper Query Wrappers
const dbQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

// --- REST API ENDPOINTS ---

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'BioTrack Biomedical Network',
    version: '2.0.0',
    portals: ['Public Donors', 'Hospitals', 'Researchers'],
    timestamp: new Date().toISOString()
  });
});

// 2. Stats
app.get('/api/stats', async (req, res) => {
  try {
    const projects = await dbQuery('SELECT COUNT(*) as count FROM research_projects');
    const datasets = await dbQuery('SELECT COUNT(*) as count FROM datasets');
    const donations = await dbQuery('SELECT SUM(crowdfunding_raised) as total_raised FROM research_projects');
    const cohorts = await dbQuery('SELECT COUNT(*) as count FROM hospital_cohorts');

    res.json({
      active_studies: projects[0]?.count || 1248,
      public_datasets: datasets[0]?.count || 4810,
      crowdfunding_raised: donations[0]?.total_raised || 128500,
      hospital_cohorts: cohorts[0]?.count || 75
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Projects
app.get('/api/projects', async (req, res) => {
  try {
    const { q, stage, status, visibility, domain } = req.query;
    let sql = `
      SELECT p.*, u.full_name as lead_name, o.name as org_name 
      FROM research_projects p
      LEFT JOIN users u ON p.lead_investigator_id = u.id
      LEFT JOIN organizations o ON p.organization_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      sql += ` AND (LOWER(p.title) LIKE ? OR LOWER(p.summary) LIKE ? OR LOWER(p.code) LIKE ? OR LOWER(u.full_name) LIKE ? OR LOWER(p.journal_citation) LIKE ?)`;
      const term = `%${q.toLowerCase()}%`;
      params.push(term, term, term, term, term);
    }

    if (status && status !== 'all') {
      sql += ` AND p.status = ?`;
      params.push(status);
    }

    if (stage && stage !== 'all') {
      sql += ` AND p.stage = ?`;
      params.push(stage);
    }

    if (visibility && visibility !== 'all') {
      sql += ` AND p.visibility = ?`;
      params.push(visibility);
    }

    if (domain && domain !== 'all') {
      sql += ` AND LOWER(p.domain) LIKE ?`;
      params.push(`%${domain.toLowerCase()}%`);
    }

    sql += ` ORDER BY p.created_at DESC`;

    const rows = await dbQuery(sql, params);
    res.json({ count: rows.length, projects: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like Research Project Endpoint
app.post('/api/projects/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'like' or 'unlike'
    const delta = action === 'unlike' ? -1 : 1;

    await dbRun('UPDATE research_projects SET likes_count = MAX(0, likes_count + ?) WHERE id = ?', [delta, id]);
    const updated = await dbQuery('SELECT likes_count FROM research_projects WHERE id = ?', [id]);

    res.json({ message: 'Like count updated successfully', likes_count: updated[0]?.likes_count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Single Project Details
app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projects = await dbQuery(`
      SELECT p.*, u.full_name as lead_name, u.email as lead_email, o.name as org_name 
      FROM research_projects p
      LEFT JOIN users u ON p.lead_investigator_id = u.id
      LEFT JOIN organizations o ON p.organization_id = o.id
      WHERE p.id = ?
    `, [id]);

    if (projects.length === 0) {
      return res.status(404).json({ error: 'Research project not found.' });
    }

    const project = projects[0];
    const milestones = await dbQuery('SELECT * FROM milestones WHERE project_id = ? ORDER BY order_index ASC', [id]);
    const datasets = await dbQuery('SELECT * FROM datasets WHERE project_id = ? ORDER BY created_at DESC', [id]);
    const donations = await dbQuery('SELECT * FROM donations WHERE project_id = ? ORDER BY created_at DESC', [id]);
    const cohorts = await dbQuery('SELECT * FROM hospital_cohorts WHERE project_id = ? ORDER BY created_at DESC', [id]);
    const rbacMembers = await dbQuery(`
      SELECT pm.*, u.full_name, u.email, u.title
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `, [id]);

    res.json({ project, milestones, datasets, donations, cohorts, rbacMembers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Create Protocol
app.post('/api/projects', async (req, res) => {
  try {
    const { title, summary, stage, visibility, domain, lead_investigator_id, crowdfunding_target } = req.body;
    if (!title || !summary) return res.status(400).json({ error: 'Title and Summary are required.' });

    const id = 'proj-' + Date.now();
    const code = 'BT-' + Math.floor(100 + Math.random() * 900);

    await dbRun(`
      INSERT INTO research_projects 
      (id, title, code, summary, stage, visibility, domain, progress_percent, crowdfunding_raised, crowdfunding_target, lead_investigator_id, organization_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, 10, 0, ?, ?, 'org-1')
    `, [id, title, code, summary, stage || 'preclinical', visibility || 'public', domain || 'oncology', crowdfunding_target || 50000, lead_investigator_id || 'usr-1']);

    res.status(201).json({ message: 'Protocol registered successfully!', id, code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Public Crowdfunding Donation Endpoint
app.post('/api/projects/:id/donate', async (req, res) => {
  try {
    const { id } = req.params;
    const { donor_name, amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid donation amount is required.' });

    const donId = 'don-' + Date.now();
    await dbRun('INSERT INTO donations (id, project_id, donor_name, amount) VALUES (?, ?, ?, ?)', [donId, id, donor_name || 'Anonymous Supporter', amount]);
    await dbRun('UPDATE research_projects SET crowdfunding_raised = crowdfunding_raised + ? WHERE id = ?', [amount, id]);

    res.json({ message: 'Donation received successfully!', donId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Hospital Anonymized Cohort Submission
app.post('/api/projects/:id/cohorts', async (req, res) => {
  try {
    const { id } = req.params;
    const { hospital_name, patient_count, biomarker_target, deidentified_summary } = req.body;
    if (!hospital_name || !patient_count) return res.status(400).json({ error: 'Hospital name and patient count are required.' });

    const hcId = 'hc-' + Date.now();
    const hash = '0x' + Math.random().toString(16).substring(2, 14);

    await dbRun(`
      INSERT INTO hospital_cohorts 
      (id, project_id, hospital_name, patient_count, biomarker_target, deidentified_summary, verification_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [hcId, id, hospital_name, patient_count, biomarker_target || 'Biomarker Target', deidentified_summary || '', hash]);

    res.json({ message: 'Hospital anonymized cohort record submitted successfully!', hcId, hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all route to serve public/index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` BioTrack Web App & API Server running on port ${PORT}`);
  console.log(` Main Website:     http://localhost:${PORT}/`);
  console.log(` Public Portal:    http://localhost:${PORT}/public-portal.html`);
  console.log(` Hospital Portal:  http://localhost:${PORT}/hospital-portal.html`);
  console.log(` Researcher Portal:http://localhost:${PORT}/researcher-portal.html`);
  console.log(` REST API Health:  http://localhost:${PORT}/api/health`);
  console.log(`=================================================`);
});
