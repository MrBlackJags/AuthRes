/**
 * AuthRos — Admin Routes (PI-only)
 * GET    /api/admin/stats        — Full platform stats
 * GET    /api/admin/users        — All users
 * PATCH  /api/admin/users/:id   — Update role/tier
 * DELETE /api/admin/users/:id   — Remove user
 */

const router = require('express').Router();
const { dbQuery, dbRun } = require('../Database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All admin routes require PI role
router.use(authenticateToken, requireRole('pi'));

// GET /api/admin/stats — Full platform stats
router.get('/stats', async (req, res) => {
  try {
    const [projectStats] = await dbQuery(`
      SELECT
        COUNT(*) as total_projects,
        SUM(CASE WHEN status = 'ongoing' THEN 1 ELSE 0 END) as ongoing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(crowdfunding_raised) as total_raised,
        SUM(crowdfunding_target) as total_target,
        SUM(likes_count) as total_likes
      FROM research_projects
    `);
    const [userStats] = await dbQuery(`
      SELECT COUNT(*) as total_users,
             SUM(CASE WHEN tier = 'enterprise' THEN 1 ELSE 0 END) as enterprise_users,
             SUM(CASE WHEN tier = 'pro' THEN 1 ELSE 0 END) as pro_users,
             SUM(CASE WHEN tier = 'free' THEN 1 ELSE 0 END) as free_users
      FROM users
    `);
    const [dsStats] = await dbQuery(`SELECT COUNT(*) as total_datasets FROM datasets`);
    const [cohortStats] = await dbQuery(`SELECT COUNT(*) as total_cohorts, SUM(patient_count) as total_patients FROM hospital_cohorts`);
    const [donationStats] = await dbQuery(`SELECT COUNT(*) as total_donations, SUM(amount) as total_donated FROM donations`);
    const [auditStats] = await dbQuery(`SELECT COUNT(*) as total_audit_events FROM audit_logs`);

    const roleBreakdown = await dbQuery(`SELECT role, COUNT(*) as count FROM users GROUP BY role`);
    const stageBreakdown = await dbQuery(`SELECT stage, COUNT(*) as count FROM research_projects GROUP BY stage`);
    const domainBreakdown = await dbQuery(`SELECT domain, COUNT(*) as count FROM research_projects GROUP BY domain ORDER BY count DESC LIMIT 10`);
    const countryBreakdown = await dbQuery(`SELECT country_name, COUNT(*) as count FROM research_projects GROUP BY country_name ORDER BY count DESC LIMIT 12`);

    res.json({
      success: true,
      data: {
        projects: projectStats,
        users: { ...userStats, role_breakdown: roleBreakdown },
        datasets: dsStats,
        cohorts: cohortStats,
        donations: donationStats,
        audit: auditStats,
        breakdowns: {
          stages: stageBreakdown,
          domains: domainBreakdown,
          countries: countryBreakdown
        },
        as_of: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/users — All users with org info
router.get('/users', async (req, res) => {
  try {
    const { q, role, tier } = req.query;
    let sql = `
      SELECT u.id, u.email, u.full_name, u.title, u.role, u.tier, u.api_key, u.created_at, o.name as org_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      sql += ` AND (LOWER(u.full_name) LIKE ? OR LOWER(u.email) LIKE ?)`;
      const t = `%${q.toLowerCase()}%`;
      params.push(t, t);
    }
    if (role && role !== 'all') { sql += ` AND u.role = ?`; params.push(role); }
    if (tier && tier !== 'all') { sql += ` AND u.tier = ?`; params.push(tier); }

    sql += ` ORDER BY u.created_at DESC`;

    const rows = await dbQuery(sql, params);
    res.json({ success: true, count: rows.length, users: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/users/:id — Update role/tier/title
router.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, tier, title } = req.body;

    const validRoles = ['admin', 'pi', 'scientist', 'tech', 'hospital', 'public', 'pending'];
    const validTiers = ['free', 'pro', 'enterprise'];

    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: `Invalid role. Must be: ${validRoles.join(', ')}` });
    }
    if (tier && !validTiers.includes(tier)) {
      return res.status(400).json({ success: false, error: `Invalid tier. Must be: ${validTiers.join(', ')}` });
    }

    const existing = await dbQuery('SELECT id FROM users WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    await dbRun(
      'UPDATE users SET role = COALESCE(?, role), tier = COALESCE(?, tier), title = COALESCE(?, title) WHERE id = ?',
      [role || null, tier || null, title || null, id]
    );

    // Log audit
    const auditId = 'audit-' + Date.now();
    await dbRun(
      'INSERT INTO audit_logs (id, action, actor_id, details) VALUES (?, ?, ?, ?)',
      [auditId, 'ADMIN_USER_UPDATE', req.user.id, `Updated user ${id}: role=${role}, tier=${tier}`]
    ).catch(() => {});

    res.json({ success: true, message: 'User updated successfully.', id, role, tier });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/users/:id — Remove user account
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account.' });
    }

    const existing = await dbQuery('SELECT id, email FROM users WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    await dbRun('DELETE FROM users WHERE id = ?', [id]);

    const auditId = 'audit-' + Date.now();
    await dbRun(
      'INSERT INTO audit_logs (id, action, actor_id, details) VALUES (?, ?, ?, ?)',
      [auditId, 'ADMIN_USER_DELETE', req.user.id, `Deleted user ${id} (${existing[0].email})`]
    ).catch(() => {});

    res.json({ success: true, message: 'User account removed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
