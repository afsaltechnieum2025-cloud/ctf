const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// ─── Auth middleware ───────────────────────────────────────────────────────────
// Reusable guard: rejects requests that have no authenticated user attached.
// Place this before any route that touches user-specific data.
function requireAuth(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Apply auth guard to every route in this file
router.use(requireAuth);

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');

    // FIX: scope query to the authenticated user's ID only
    const userId = req.user.id;
    const [rows] = await pool.execute(
      `SELECT * FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', async (req, res) => {
  try {
    // FIX: count only THIS user's unread notifications
    const userId = req.user.id;
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS count
       FROM notifications
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res) => {
  try {
    // FIX: mark read only for THIS user, not every row in the table
    const userId = req.user.id;
    await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    // FIX: include user_id in WHERE clause so a user can't mark
    //      another user's notification as read by guessing its ID
    const userId = req.user.id;
    const notifId = req.params.id;

    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notifId, userId]
    );

    // affectedRows === 0 means the row doesn't exist OR belongs to someone else
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;