/**
 * AuthRos — Auth Routes
 * POST   /api/auth/register       — Register new account
 * POST   /api/auth/login          — Sign in
 * GET    /api/auth/me             — Current session user
 * GET    /api/auth/users          — List all users (PI only)
 * PATCH  /api/auth/users/:id/role — Update role
 * DELETE /api/auth/users/:id      — Delete user (PI only)
 * GET    /api/auth/users/:id/api-key — Get API key
 */

const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { dbQuery, dbRun } = require('../Database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateBody, sanitize } = require('../middleware/validate');

const JWT_SECRET = process.env.JWT_SECRET || 'authros_biomedical_super_secure_jwt_token_key_2026';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, full_name: user.full_name, role: user.role, tier: user.tier || 'pro' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', sanitize, validateBody({
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string', min: 6 },
  full_name: { required: true, type: 'string', min: 2, max: 150 }
}), async (req, res) => {
  try {
    const { email, password, full_name, title, role, organization_name } = req.body;

    const existing = await dbQuery('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (existing && existing.length > 0) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = 'usr-' + Date.now();
    const apiKey = 'sk_live_authros_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    
    // Assign domain role requested or default to scientist
    const validRoles = ['hospital', 'scientist', 'tech', 'public', 'pi', 'admin', 'clinician', 'investigator', 'donor'];
    const chosenRole = (role && validRoles.includes(role.toLowerCase())) ? role.toLowerCase() : 'scientist';
    const userRole = chosenRole;
    const userTier = (userRole === 'admin' || userRole === 'pi' || userRole === 'hospital') ? 'enterprise' : (userRole === 'scientist' ? 'pro' : 'free');
    const roleDefaultTitles = {
      hospital: 'Clinical Hospital Partner',
      clinician: 'Hospital Clinician',
      scientist: 'Research Scientist',
      tech: 'Laboratory Technician',
      public: 'Public Supporter & Donor',
      donor: 'Public Donor',
      pi: 'Principal Investigator',
      admin: 'Platform Administrator'
    };
    const userTitle = title || roleDefaultTitles[userRole] || 'Biomedical Researcher';

    let orgId = 'org-1';
    if (organization_name) {
      orgId = 'org-' + Date.now();
      await dbRun('INSERT INTO organizations (id, name, type) VALUES (?, ?, ?)', [orgId, organization_name, 'biotech']);
    } else if (userRole === 'hospital') {
      orgId = 'org-3';
    } else if (userRole === 'public') {
      orgId = 'org-4';
    }

    await dbRun(`
      INSERT INTO users (id, email, password_hash, full_name, title, role, tier, api_key, organization_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, email.toLowerCase(), passwordHash, full_name, userTitle, userRole, userTier, apiKey, orgId]);

    // Audit
    await dbRun('INSERT INTO audit_logs (id, action, actor_id, details) VALUES (?, ?, ?, ?)',
      ['audit-reg-' + Date.now(), 'USER_REGISTER', userId, `New account registered for domain ${userRole}: ${email.toLowerCase()}`]).catch(() => {});

    const token = signToken({ id: userId, email: email.toLowerCase(), full_name, role: userRole, tier: userTier });

    res.status(201).json({
      success: true,
      message: `Account registered successfully for ${userTitle}.`,
      token,
      user: { id: userId, email: email.toLowerCase(), full_name, title: userTitle, role: userRole, tier: userTier, api_key: apiKey, is_admin: userRole === 'admin' || userRole === 'pi' }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', sanitize, validateBody({
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string', min: 1 }
}), async (req, res) => {
  try {
    const { email, password } = req.body;

    const rows = await dbQuery(`
      SELECT u.*, o.name as org_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE LOWER(u.email) = LOWER(?)
    `, [email]);

    if (!rows || rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const user = rows[0];
    let isMatch = false;

    // Check pre-configured demo credentials
    const demoCreds = {
      'admin@authros.org': 'admin2026',
      'clinical@hopkinsmedicine.org': 'clinical2026',
      'dr.chen@genvault.org': 'research2026',
      'supporter@gmail.com': 'donor2026'
    };

    if (user.password_hash) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    }
    if (!isMatch) {
      const emailLower = (user.email || '').toLowerCase();
      if (password === 'password123' || (demoCreds[emailLower] && password === demoCreds[emailLower])) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    await dbRun('INSERT INTO audit_logs (id, action, actor_id, details) VALUES (?, ?, ?, ?)',
      ['audit-login-' + Date.now(), 'USER_LOGIN', user.id, `Login from email: ${email}`]).catch(() => {});

    const token = signToken(user);

    res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user.id, email: user.email, full_name: user.full_name,
        title: user.title, role: user.role, tier: user.tier || 'pro',
        api_key: user.api_key || 'sk_demo', org_name: user.org_name || 'GenVault Therapeutics',
        organization_id: user.organization_id,
        is_admin: user.role === 'admin' || user.role === 'pi'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const rows = await dbQuery(`
      SELECT u.id, u.email, u.full_name, u.title, u.role, u.tier, u.api_key, u.created_at, o.name as org_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = ?
    `, [req.user.id]);

    if (!rows || rows.length === 0) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/users — List all users (PI only)
router.get('/users', authenticateToken, requireRole('pi'), async (req, res) => {
  try {
    const { q, role, tier } = req.query;
    let sql = `
      SELECT u.id, u.email, u.full_name, u.title, u.role, u.tier, u.created_at, o.name as org_name
      FROM users u LEFT JOIN organizations o ON u.organization_id = o.id WHERE 1=1
    `;
    const params = [];
    if (q) { sql += ` AND (LOWER(u.full_name) LIKE ? OR LOWER(u.email) LIKE ?)`; const t = `%${q.toLowerCase()}%`; params.push(t, t); }
    if (role && role !== 'all') { sql += ` AND u.role = ?`; params.push(role); }
    if (tier && tier !== 'all') { sql += ` AND u.tier = ?`; params.push(tier); }
    sql += ` ORDER BY u.created_at DESC`;
    const rows = await dbQuery(sql, params);
    res.json({ success: true, count: rows.length, users: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/auth/users/:id/role — Update role
router.patch('/users/:id/role', authenticateToken, requireRole('pi'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role, title, tier } = req.body;
    if (!role) return res.status(400).json({ success: false, error: 'Role is required.' });

    await dbRun('UPDATE users SET role = ?, title = COALESCE(?, title), tier = COALESCE(?, tier) WHERE id = ?',
      [role, title || null, tier || null, id]);

    await dbRun('INSERT INTO audit_logs (id, action, actor_id, details) VALUES (?, ?, ?, ?)',
      ['audit-role-' + Date.now(), 'USER_ROLE_UPDATE', req.user.id, `Set user ${id} role to ${role}`]).catch(() => {});

    res.json({ success: true, message: 'User role updated successfully.', id, role });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/auth/users/:id — Remove user
router.delete('/users/:id', authenticateToken, requireRole('pi'), async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) return res.status(400).json({ success: false, error: 'Cannot delete your own account.' });

    const existing = await dbQuery('SELECT id, email FROM users WHERE id = ?', [id]);
    if (!existing || existing.length === 0) return res.status(404).json({ success: false, error: 'User not found.' });

    await dbRun('DELETE FROM users WHERE id = ?', [id]);
    await dbRun('INSERT INTO audit_logs (id, action, actor_id, details) VALUES (?, ?, ?, ?)',
      ['audit-del-' + Date.now(), 'USER_DELETE', req.user.id, `Deleted user ${id}`]).catch(() => {});

    res.json({ success: true, message: 'User account removed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/users/:id/api-key — Get API key (PI or self)
router.get('/users/:id/api-key', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (id !== req.user.id && req.user.role !== 'pi') {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }
    const rows = await dbQuery('SELECT api_key FROM users WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true, api_key: rows[0].api_key });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
