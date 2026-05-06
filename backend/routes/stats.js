const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/stats/dashboard
 * Authenticated users only (auth middleware on mount).
 * Returns aggregate counts for the dashboard — no per-user listing.
 */
router.get('/dashboard', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) AS c FROM users');
    const userCount = Number(rows[0]?.c ?? 0);
    res.json({ userCount });
  } catch (err) {
    console.error('stats/dashboard:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
