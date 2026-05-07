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
    const [userRows, productRows, courseRows] = await Promise.all([
      db.query('SELECT COUNT(*) AS c FROM users'),
      db.query('SELECT COUNT(*) AS c FROM products'),
      db.query('SELECT COUNT(*) AS c FROM course_topics'),
    ]);

    const readC = (qr) => Number(qr[0]?.[0]?.c ?? 0);

    res.json({
      userCount: readC(userRows),
      productCount: readC(productRows),
      courseTopicCount: readC(courseRows),
    });
  } catch (err) {
    console.error('stats/dashboard:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
