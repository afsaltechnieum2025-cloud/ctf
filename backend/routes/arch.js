const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db'); // your mysql2/promise pool

function parseConnections(raw) {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object') return [];
  if (typeof raw === 'string') {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  return [];
}

// ── GET all components for a project ─────────────────────────────────────────
router.get('/:projectId/arch', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM arch_components WHERE project_id = ? ORDER BY created_at ASC',
      [req.params.projectId]
    );
    const components = rows.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      ip: r.ip ?? '',
      port: r.port ?? '',
      tech: r.tech ?? '',
      notes: r.notes ?? '',
      connections: parseConnections(r.connections),
    }));
    res.json({ success: true, data: components });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch components' });
  }
});

// ── POST create one component ─────────────────────────────────────────────────
router.post('/:projectId/arch', async (req, res) => {
  const { name, type, ip, port, tech, notes, connections = [] } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required' });

  const id = uuidv4();
  try {
    await db.query(
      `INSERT INTO arch_components (id, project_id, name, type, ip, port, tech, notes, connections)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.params.projectId, name, type || 'server', ip || null, port || null,
       tech || null, notes || null, JSON.stringify(connections)]
    );
    res.status(201).json({ success: true, data: { id, name, type, ip, port, tech, notes, connections } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create component' });
  }
});

// ── PUT bulk replace all components for a project ─────────────────────────────
// Used after file upload/parse to save the whole generated set at once
router.put('/:projectId/arch/bulk', async (req, res) => {
  const { components } = req.body; // array of component objects
  if (!Array.isArray(components)) return res.status(400).json({ success: false, message: 'components must be an array' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM arch_components WHERE project_id = ?', [req.params.projectId]);

    if (components.length) {
      const values = components.map(c => [
        c.id || uuidv4(),
        req.params.projectId,
        c.name,
        c.type || 'server',
        c.ip || null,
        c.port || null,
        c.tech || null,
        c.notes || null,
        JSON.stringify(c.connections || []),
      ]);
      await conn.query(
        `INSERT INTO arch_components (id, project_id, name, type, ip, port, tech, notes, connections)
         VALUES ?`,
        [values]
      );
    }
    await conn.commit();
    res.json({ success: true, count: components.length });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Bulk save failed' });
  } finally {
    conn.release();
  }
});

// ── PATCH update one component ────────────────────────────────────────────────
router.patch('/:projectId/arch/:id', async (req, res) => {
  const { name, type, ip, port, tech, notes, connections } = req.body;
  const fields = [];
  const vals = [];

  if (name !== undefined)        { fields.push('name = ?');        vals.push(name); }
  if (type !== undefined)        { fields.push('type = ?');        vals.push(type); }
  if (ip !== undefined)          { fields.push('ip = ?');          vals.push(ip || null); }
  if (port !== undefined)        { fields.push('port = ?');        vals.push(port || null); }
  if (tech !== undefined)        { fields.push('tech = ?');        vals.push(tech || null); }
  if (notes !== undefined)       { fields.push('notes = ?');       vals.push(notes || null); }
  if (connections !== undefined) { fields.push('connections = ?'); vals.push(JSON.stringify(connections)); }

  if (!fields.length) return res.status(400).json({ success: false, message: 'Nothing to update' });

  vals.push(req.params.id, req.params.projectId);
  try {
    const [result] = await db.query(
      `UPDATE arch_components SET ${fields.join(', ')} WHERE id = ? AND project_id = ?`,
      vals
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Component not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update component' });
  }
});

// ── DELETE one component ──────────────────────────────────────────────────────
router.delete('/:projectId/arch/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM arch_components WHERE id = ? AND project_id = ?',
      [req.params.id, req.params.projectId]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Component not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete component' });
  }
});

module.exports = router;