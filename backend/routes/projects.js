// routes/projects.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const jwt     = require('jsonwebtoken');
const { sendProjectAssignmentEmail } = require('../utils/emailService');

// ─── Auth middleware ─────────────────────────────────────────────────────────

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};

const requireAdminOrManager = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    if (!['admin', 'manager'].includes(decoded.role)) {
      return res.status(403).json({ message: 'Forbidden: Admin or Manager access required' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};

// ─────────────────────────────────────────────────────────────
//  HELPER: Auto-generate next project code (e.g. TOP004)
// ─────────────────────────────────────────────────────────────
async function generateProjectCode() {
  // Use the highest existing TOP### suffix, not the row with max new_id — those can
  // diverge (imports, manual edits) and would reuse an existing code (duplicate key).
  const [rows] = await db.query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(project_code, 4) AS UNSIGNED)), 0) AS max_seq
     FROM projects
     WHERE project_code REGEXP '^TOP[0-9]+$'`
  );
  const maxSeq = Number(rows[0]?.max_seq ?? 0);
  return `TOP${String(maxSeq + 1).padStart(3, '0')}`;
}

// ─────────────────────────────────────────────────────────────
//  HELPER: Fetch assignedTesters for one or more project IDs
// ─────────────────────────────────────────────────────────────
async function fetchAssignedTesters(projectIds) {
  if (!projectIds.length) return {};
  const placeholders = projectIds.map(() => '?').join(',');
  const [rows] = await db.query(
    `SELECT project_id, user_id FROM project_assignments WHERE project_id IN (${placeholders})`,
    projectIds
  );
  const map = {};
  projectIds.forEach(id => { map[id] = []; });
  rows.forEach(r => { if (map[r.project_id]) map[r.project_id].push(String(r.user_id)); });
  return map;
}

// ─────────────────────────────────────────────────────────────
//  GET /api/projects/test-email  (admin only)
// ─────────────────────────────────────────────────────────────
router.get('/test-email', requireAdmin, async (req, res) => {
  const { user_id, project_id } = req.query;
  if (!user_id || !project_id) {
    return res.status(400).json({
      message: 'Both user_id and project_id query params are required',
      example: '/api/projects/test-email?user_id=26&project_id=b5a5531d-...',
    });
  }
  try {
    const [[project]] = await db.query(
      `SELECT id, name, client, start_date, end_date FROM projects WHERE id = ?`, [project_id]
    );
    if (!project) return res.status(404).json({ message: `Project not found for id: ${project_id}` });

    const [[user]] = await db.query(
      `SELECT id, name, full_name, email FROM users WHERE id = ?`, [user_id]
    );
    if (!user) return res.status(404).json({ message: `User not found for id: ${user_id}` });

    const result = await sendProjectAssignmentEmail({
      toEmail:     user.email,
      toName:      user.full_name || user.name,
      projectName: project.name,
      clientName:  project.client,
      startDate:   project.start_date,
      endDate:     project.end_date,
      assignedBy:  'Technieum Management (Test)',
      projectId:   project.id,
    });

    res.json({ success: true, message: `Test email sent to ${user.email}`, resend_id: result.id });
  } catch (err) {
    console.error('[TEST EMAIL] Failed:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /api/projects  (any authenticated user)
// ─────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.*,
        COUNT(DISTINCT f.id)                                                         AS findings_count,
        COUNT(DISTINCT CASE WHEN LOWER(f.severity) = 'critical' THEN f.id END)       AS critical_count,
        COUNT(DISTINCT CASE WHEN LOWER(f.severity) = 'high'     THEN f.id END)       AS high_count,
        COUNT(DISTINCT CASE WHEN LOWER(f.severity) = 'medium'   THEN f.id END)       AS medium_count,
        COUNT(DISTINCT CASE WHEN LOWER(f.severity) = 'low'      THEN f.id END)       AS low_count,
        COUNT(DISTINCT CASE WHEN LOWER(f.severity) = 'info'
                              OR LOWER(f.severity) = 'informational' THEN f.id END)  AS info_count,
        COUNT(DISTINCT pa.id)                                                         AS assignees_count
      FROM projects p
      LEFT JOIN findings            f  ON f.project_id  = p.id
      LEFT JOIN project_assignments pa ON pa.project_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    const projectIds = rows.map(r => r.id);
    const testersMap = await fetchAssignedTesters(projectIds);

    res.json(rows.map(row => ({
      ...row,
      ip_addresses: row.ip_addresses
        ? (typeof row.ip_addresses === 'string' ? JSON.parse(row.ip_addresses) : row.ip_addresses)
        : null,
      findings_count:  Number(row.findings_count),
      critical_count:  Number(row.critical_count),
      high_count:      Number(row.high_count),
      medium_count:    Number(row.medium_count),
      low_count:       Number(row.low_count),
      info_count:      Number(row.info_count),
      assignees_count: Number(row.assignees_count),
      assignedTesters: testersMap[row.id] ?? [],
    })));
  } catch (err) {
    console.error('GET /api/projects error:', err);
    res.status(500).json({ message: err.sqlMessage || err.message || 'Failed to fetch projects' });
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /api/projects/:id  (any authenticated user)
// ─────────────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.*,
        COUNT(DISTINCT f.id)                                                         AS findings_count,
        COUNT(DISTINCT CASE WHEN LOWER(f.severity) = 'critical' THEN f.id END)       AS critical_count,
        COUNT(DISTINCT CASE WHEN LOWER(f.severity) = 'high'     THEN f.id END)       AS high_count,
        COUNT(DISTINCT CASE WHEN LOWER(f.severity) = 'medium'   THEN f.id END)       AS medium_count,
        COUNT(DISTINCT CASE WHEN LOWER(f.severity) = 'low'      THEN f.id END)       AS low_count,
        COUNT(DISTINCT CASE WHEN LOWER(f.severity) = 'info'
                              OR LOWER(f.severity) = 'informational' THEN f.id END)  AS info_count,
        COUNT(DISTINCT pa.id)                                                         AS assignees_count
      FROM projects p
      LEFT JOIN findings            f  ON f.project_id  = p.id
      LEFT JOIN project_assignments pa ON pa.project_id = p.id
      WHERE p.id = ?
      GROUP BY p.id
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ message: 'Project not found' });

    const row        = rows[0];
    const testersMap = await fetchAssignedTesters([row.id]);

    res.json({
      ...row,
      ip_addresses: row.ip_addresses
        ? (typeof row.ip_addresses === 'string' ? JSON.parse(row.ip_addresses) : row.ip_addresses)
        : null,
      findings_count:  Number(row.findings_count),
      critical_count:  Number(row.critical_count),
      high_count:      Number(row.high_count),
      medium_count:    Number(row.medium_count),
      low_count:       Number(row.low_count),
      info_count:      Number(row.info_count),
      assignees_count: Number(row.assignees_count),
      assignedTesters: testersMap[row.id] ?? [],
    });
  } catch (err) {
    console.error('GET /api/projects/:id error:', err);
    res.status(500).json({ message: err.sqlMessage || err.message || 'Failed to fetch project' });
  }
});

// ─────────────────────────────────────────────────────────────
//  POST /api/projects  (admin or manager only)
// ─────────────────────────────────────────────────────────────
router.post('/', requireAdminOrManager, async (req, res) => {
  const {
    name,
    client,
    description      = null,
    scope            = null,
    test_credentials = null,
    business_logic   = null,
    entry_points     = null,
    auth_controls    = null,
    tech_stack       = null,
    domain,
    ip_addresses     = null,
    start_date       = null,
    end_date         = null,
    created_by       = null,
    status           = 'active',
  } = req.body;

  if (!name || !client) {
    return res.status(400).json({ message: 'name and client are required' });
  }

  try {
    const projectCode    = await generateProjectCode();
    const [[{ newId }]]  = await db.query(`SELECT UUID() AS newId`);

    await db.query(
      `INSERT INTO projects
         (id, name, project_code, client, description, scope, test_credentials,
          business_logic, entry_points, auth_controls, tech_stack,
          domain, ip_addresses, start_date, end_date, created_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId, name, projectCode, client,
        description,
        scope,
        test_credentials,
        business_logic || null,
        entry_points || null,
        auth_controls || null,
        tech_stack || null,
        domain || null,
        ip_addresses ? JSON.stringify(ip_addresses) : null,
        start_date || null,
        end_date   || null,
        created_by || null,
        status,
      ]
    );

    const [rows] = await db.query('SELECT * FROM projects WHERE id = ?', [newId]);
    res.status(201).json({
      ...rows[0],
      ip_addresses:    rows[0].ip_addresses ? JSON.parse(rows[0].ip_addresses) : null,
      findings_count:  0,
      critical_count:  0,
      high_count:      0,
      medium_count:    0,
      low_count:       0,
      info_count:      0,
      assignees_count: 0,
      assignedTesters: [],
    });
  } catch (err) {
    console.error('POST /api/projects error:', err);
    res.status(500).json({ message: err.sqlMessage || err.message || 'Failed to create project' });
  }
});

// ─────────────────────────────────────────────────────────────
//  PATCH /api/projects/:id  (admin or manager only)
// ─────────────────────────────────────────────────────────────
router.patch('/:id', requireAdminOrManager, async (req, res) => {
  const { id }  = req.params;
  const fields  = req.body;

  const allowed = [
    'name', 'client', 'description',
    'scope',
    'test_credentials',
    'business_logic', 'entry_points', 'auth_controls', 'tech_stack',
    'domain', 'ip_addresses', 'status', 'start_date', 'end_date',
  ];

  const keys   = Object.keys(fields).filter(k => allowed.includes(k));
  const values = keys.map(k => {
    if (k === 'ip_addresses' && Array.isArray(fields[k])) return JSON.stringify(fields[k]);
    return fields[k];
  });

  if (keys.length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  const setClauses = keys.map(k => `${k} = ?`).join(', ');
  try {
    const [result] = await db.query(
      `UPDATE projects SET ${setClauses} WHERE id = ?`, [...values, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Project not found' });

    const [rows] = await db.query(`
      SELECT p.*,
        COUNT(DISTINCT f.id) AS findings_count,
        COUNT(DISTINCT CASE WHEN LOWER(f.severity) = 'critical' THEN f.id END) AS critical_count,
        COUNT(DISTINCT CASE WHEN LOWER(f.severity) = 'high'     THEN f.id END) AS high_count,
        COUNT(DISTINCT CASE WHEN LOWER(f.severity) = 'medium'   THEN f.id END) AS medium_count,
        COUNT(DISTINCT CASE WHEN LOWER(f.severity) = 'low'      THEN f.id END) AS low_count,
        COUNT(DISTINCT CASE WHEN LOWER(f.severity) = 'info'
                              OR LOWER(f.severity) = 'informational' THEN f.id END) AS info_count,
        COUNT(DISTINCT pa.id) AS assignees_count
      FROM projects p
      LEFT JOIN findings f ON f.project_id = p.id
      LEFT JOIN project_assignments pa ON pa.project_id = p.id
      WHERE p.id = ? GROUP BY p.id
    `, [id]);

    const row        = rows[0];
    const testersMap = await fetchAssignedTesters([row.id]);
    res.json({
      ...row,
      ip_addresses: row.ip_addresses
        ? (typeof row.ip_addresses === 'string' ? JSON.parse(row.ip_addresses) : row.ip_addresses)
        : null,
      findings_count:  Number(row.findings_count),
      critical_count:  Number(row.critical_count),
      high_count:      Number(row.high_count),
      medium_count:    Number(row.medium_count),
      low_count:       Number(row.low_count),
      info_count:      Number(row.info_count),
      assignees_count: Number(row.assignees_count),
      assignedTesters: testersMap[row.id] ?? [],
    });
  } catch (err) {
    console.error('PATCH /api/projects/:id error:', err);
    res.status(500).json({ message: err.sqlMessage || err.message || 'Failed to update project' });
  }
});

// ─────────────────────────────────────────────────────────────
//  DELETE /api/projects/:id  (admin only)
// ─────────────────────────────────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const [prows] = await db.query('SELECT id, name FROM projects WHERE id = ?', [req.params.id]);
    if (prows.length === 0) return res.status(404).json({ message: 'Project not found' });
    const [result] = await db.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Project not found' });
    res.json({
      message: 'Project deleted successfully',
      name: prows[0].name,
      id: prows[0].id,
    });
  } catch (err) {
    console.error('DELETE /api/projects/:id error:', err);
    res.status(500).json({ message: err.sqlMessage || err.message || 'Failed to delete project' });
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /api/projects/:id/assignments  (any authenticated user)
// ─────────────────────────────────────────────────────────────
router.get('/:id/assignments', requireAuth, async (req, res) => {
  try {
    const [assignments] = await db.query(
      `SELECT pa.id, pa.user_id, pa.assigned_at
       FROM project_assignments pa WHERE pa.project_id = ? ORDER BY pa.assigned_at ASC`,
      [req.params.id]
    );
    if (assignments.length === 0) return res.json([]);

    const userIds      = assignments.map(a => a.user_id);
    const placeholders = userIds.map(() => '?').join(',');
    const [users]      = await db.query(
      `SELECT id, name, full_name, email, role FROM users WHERE id IN (${placeholders})`, userIds
    );

    const userMap = {};
    users.forEach(u => {
      userMap[String(u.id)] = u.full_name || u.name || u.email || String(u.id);
    });

    res.json(assignments.map(a => ({
      ...a,
      username: userMap[String(a.user_id)] || String(a.user_id),
    })));
  } catch (err) {
    console.error('GET /api/projects/:id/assignments error:', err);
    res.status(500).json({ message: err.sqlMessage || err.message || 'Failed to fetch assignments' });
  }
});

// ─────────────────────────────────────────────────────────────
//  POST /api/projects/:id/assignments  (admin or manager only)
// ─────────────────────────────────────────────────────────────
router.post('/:id/assignments', requireAdminOrManager, async (req, res) => {
  const { user_id, assigned_by_id } = req.body;
  if (!user_id) return res.status(400).json({ message: 'user_id is required' });

  try {
    const [[{ newId }]] = await db.query(`SELECT UUID() AS newId`);
    await db.query(
      `INSERT INTO project_assignments (id, project_id, user_id) VALUES (?, ?, ?)`,
      [newId, req.params.id, user_id]
    );

    // ── Email notification ────────────────────────────────────
    try {
      const [[project]] = await db.query(
        `SELECT id, name, client, start_date, end_date FROM projects WHERE id = ?`, [req.params.id]
      );
      const [[assignee]] = await db.query(
        `SELECT id, name, full_name, email FROM users WHERE id = ?`, [user_id]
      );
      let assignerName = 'Technieum Management';
      if (assigned_by_id) {
        const [[assigner]] = await db.query(
          `SELECT name, full_name FROM users WHERE id = ?`, [assigned_by_id]
        );
        if (assigner) assignerName = assigner.full_name || assigner.name;
      }
      if (project && assignee && assignee.email) {
        sendProjectAssignmentEmail({
          toEmail:     assignee.email,
          toName:      assignee.full_name || assignee.name,
          projectName: project.name,
          clientName:  project.client,
          startDate:   project.start_date,
          endDate:     project.end_date,
          assignedBy:  assignerName,
          projectId:   project.id,
        }).catch(e => console.error('[Email] Assignment notification failed:', e.message));
      }
    } catch (emailErr) {
      console.error('[Email] Lookup failed:', emailErr.message);
    }
    // ─────────────────────────────────────────────────────────

    res.status(201).json({ message: 'Tester assigned successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Tester is already assigned to this project' });
    }
    console.error('POST /api/projects/:id/assignments error:', err);
    res.status(500).json({ message: err.sqlMessage || err.message || 'Failed to assign tester' });
  }
});

// ─────────────────────────────────────────────────────────────
//  DELETE /api/projects/:id/assignments/:userId  (admin or manager)
// ─────────────────────────────────────────────────────────────
router.delete('/:id/assignments/:userId', requireAdminOrManager, async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM project_assignments WHERE project_id = ? AND user_id = ?',
      [req.params.id, req.params.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Assignment not found' });
    res.json({ message: 'Tester unassigned successfully' });
  } catch (err) {
    console.error('DELETE /api/projects/:id/assignments/:userId error:', err);
    res.status(500).json({ message: err.sqlMessage || err.message || 'Failed to unassign tester' });
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /api/projects/:id/checklist  (any authenticated user)
// ─────────────────────────────────────────────────────────────
router.get('/:id/checklist', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM project_checklists WHERE project_id = ? ORDER BY checklist_type, category, item_key`,
      [req.params.id]
    );
    res.json(rows.map(r => ({ ...r, is_checked: Boolean(r.is_checked) })));
  } catch (err) {
    console.error('GET /projects/:id/checklist error:', err);
    res.status(500).json({ message: err.sqlMessage || err.message || 'Failed to fetch checklist' });
  }
});

// ─────────────────────────────────────────────────────────────
//  POST /api/projects/:id/checklist  (any authenticated user)
// ─────────────────────────────────────────────────────────────
router.post('/:id/checklist', requireAuth, async (req, res) => {
  const { checklist_type, category, item_key, is_checked, updated_by } = req.body;
  if (!checklist_type || !category || !item_key) {
    return res.status(400).json({ message: 'checklist_type, category, and item_key are required' });
  }
  try {
    const [[{ newId }]] = await db.query(`SELECT UUID() AS newId`);
    await db.query(
      `INSERT INTO project_checklists
         (id, project_id, checklist_type, category, item_key, is_checked, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         is_checked = VALUES(is_checked),
         updated_by = VALUES(updated_by),
         updated_at = NOW()`,
      [newId, req.params.id, checklist_type, category, item_key, is_checked ? 1 : 0, updated_by || null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('POST /projects/:id/checklist error:', err);
    res.status(500).json({ message: err.sqlMessage || err.message || 'Failed to save checklist item' });
  }
});

module.exports = router;