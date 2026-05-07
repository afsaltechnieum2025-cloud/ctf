const express = require('express');
const router = express.Router();
const db = require('../db');

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
}

function requireAdminOrManager(req, res, next) {
  const role = req.user?.role;
  if (!role || !['admin', 'manager'].includes(role)) {
    return res.status(403).json({ error: 'Admin or manager access required' });
  }
  return next();
}

const QUIZ_TYPES = new Set(['product_mcq', 'course_topic_quiz']);

/** Resolve display name from `products` / `course_topics` (slug or numeric id in subject_slug). */
const QUIZ_SUBJECT_NAME_SQL = `
  CASE qa.quiz_type
    WHEN 'product_mcq' THEN COALESCE(ps.name, pi.name, qa.subject_slug)
    WHEN 'course_topic_quiz' THEN COALESCE(ts.title, ti.title, qa.subject_slug)
    ELSE qa.subject_slug
  END AS subject_name`;

const QUIZ_SUBJECT_JOINS = `
  LEFT JOIN products ps ON qa.quiz_type = 'product_mcq' AND ps.slug = qa.subject_slug
  LEFT JOIN products pi ON qa.quiz_type = 'product_mcq'
    AND qa.subject_slug REGEXP '^[0-9]+$' AND pi.id = CAST(qa.subject_slug AS UNSIGNED)
  LEFT JOIN course_topics ts ON qa.quiz_type = 'course_topic_quiz' AND ts.slug = qa.subject_slug
  LEFT JOIN course_topics ti ON qa.quiz_type = 'course_topic_quiz'
    AND qa.subject_slug REGEXP '^[0-9]+$' AND ti.id = CAST(qa.subject_slug AS UNSIGNED)`;

/**
 * GET /api/quiz-attempts/me
 * Current user's recent quiz completions (for dashboard).
 */
router.get('/me', async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isFinite(userId) || userId < 1) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [rows] = await db.query(
      `SELECT qa.id, qa.quiz_type, qa.subject_slug, qa.score_correct, qa.score_total, qa.completed_at,
              ${QUIZ_SUBJECT_NAME_SQL}
       FROM quiz_attempts qa
       ${QUIZ_SUBJECT_JOINS}
       WHERE qa.user_id = ?
       ORDER BY qa.completed_at DESC
       LIMIT 30`,
      [userId]
    );

    const attempts = rows.map((r) => ({
      id: r.id,
      quizType: r.quiz_type,
      subjectSlug: r.subject_slug,
      subjectName: r.subject_name != null ? String(r.subject_name) : r.subject_slug,
      scoreCorrect: Number(r.score_correct),
      scoreTotal: Number(r.score_total),
      completedAt: r.completed_at,
    }));

    res.json({ attempts });
  } catch (err) {
    console.error('quiz-attempts GET /me:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/quiz-attempts
 * Record a completed quiz (caller should send scores when user finishes).
 */
router.post('/', async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isFinite(userId) || userId < 1) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { quizType, subjectSlug, scoreCorrect, scoreTotal } = req.body;

    if (!QUIZ_TYPES.has(quizType)) {
      return res.status(400).json({ error: 'Invalid quizType' });
    }
    if (typeof subjectSlug !== 'string' || !subjectSlug.trim()) {
      return res.status(400).json({ error: 'subjectSlug is required' });
    }

    const correct = Number(scoreCorrect);
    const total = Number(scoreTotal);
    if (!Number.isInteger(correct) || !Number.isInteger(total) || total < 1 || correct < 0 || correct > total) {
      return res.status(400).json({ error: 'Invalid scoreCorrect / scoreTotal' });
    }

    const [packet] = await db.query(
      `INSERT INTO quiz_attempts (user_id, quiz_type, subject_slug, score_correct, score_total)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, quizType, subjectSlug.trim().slice(0, 191), correct, total]
    );

    const rawId = packet && typeof packet === 'object' && 'insertId' in packet ? packet.insertId : undefined;
    const insertId = rawId != null ? Number(rawId) : undefined;

    res.status(201).json({ ok: true, id: Number.isFinite(insertId) ? insertId : undefined });
  } catch (err) {
    console.error('quiz-attempts POST:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/quiz-attempts/admin/users/:userId/report
 * Full quiz history for one user (admin + manager — same as /api/users list).
 */
router.get('/admin/users/:userId/report', requireAdminOrManager, async (req, res) => {
  try {
    const targetId = Number(req.params.userId);
    if (!Number.isFinite(targetId) || targetId < 1) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const [urows] = await db.query(
      'SELECT id, name, full_name, email, role, created_at FROM users WHERE id = ? LIMIT 1',
      [targetId]
    );
    if (!urows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    const u = urows[0];

    const [arows] = await db.query(
      `SELECT qa.id, qa.quiz_type, qa.subject_slug, qa.score_correct, qa.score_total, qa.completed_at,
              ${QUIZ_SUBJECT_NAME_SQL}
       FROM quiz_attempts qa
       ${QUIZ_SUBJECT_JOINS}
       WHERE qa.user_id = ?
       ORDER BY qa.completed_at DESC`,
      [targetId]
    );

    const attempts = arows.map((r) => ({
      id: r.id,
      quizType: r.quiz_type,
      subjectSlug: r.subject_slug,
      subjectName: r.subject_name != null ? String(r.subject_name) : r.subject_slug,
      scoreCorrect: Number(r.score_correct),
      scoreTotal: Number(r.score_total),
      completedAt: r.completed_at,
    }));

    let productN = 0;
    let courseN = 0;
    let productSumPct = 0;
    let courseSumPct = 0;
    for (const a of attempts) {
      const pct = (100.0 * a.scoreCorrect) / a.scoreTotal;
      if (a.quizType === 'product_mcq') {
        productN += 1;
        productSumPct += pct;
      } else if (a.quizType === 'course_topic_quiz') {
        courseN += 1;
        courseSumPct += pct;
      }
    }

    const round1 = (x) => Math.round(x * 10) / 10;

    res.json({
      user: {
        id: u.id,
        name: u.name,
        fullName: u.full_name,
        email: u.email,
        role: u.role,
        createdAt: u.created_at,
      },
      summary: {
        productQuizAttempts: productN,
        courseQuizAttempts: courseN,
        productAvgPercent: productN > 0 ? round1(productSumPct / productN) : null,
        courseAvgPercent: courseN > 0 ? round1(courseSumPct / courseN) : null,
      },
      attempts,
    });
  } catch (err) {
    console.error('quiz-attempts admin/users/:userId/report:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/quiz-attempts/admin/overview
 * Per-user aggregates + recent attempts (admin only).
 */
router.get('/admin/overview', requireAdmin, async (req, res) => {
  try {
    const [userRows] = await db.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.full_name,
         u.role,
         COUNT(CASE WHEN qa.quiz_type = 'product_mcq' THEN 1 END) AS product_quiz_attempts,
         COUNT(CASE WHEN qa.quiz_type = 'course_topic_quiz' THEN 1 END) AS course_quiz_attempts,
         MAX(CASE WHEN qa.quiz_type = 'product_mcq' THEN qa.completed_at END) AS last_product_at,
         MAX(CASE WHEN qa.quiz_type = 'course_topic_quiz' THEN qa.completed_at END) AS last_course_at,
         AVG(CASE WHEN qa.quiz_type = 'product_mcq' THEN (100.0 * qa.score_correct / qa.score_total) END) AS product_avg_percent,
         AVG(CASE WHEN qa.quiz_type = 'course_topic_quiz' THEN (100.0 * qa.score_correct / qa.score_total) END) AS course_avg_percent,
         (SELECT GROUP_CONCAT(
            DISTINCT COALESCE(ps.name, pi.name, qx.subject_slug)
            ORDER BY COALESCE(ps.name, pi.name, qx.subject_slug) SEPARATOR ', ')
          FROM quiz_attempts qx
          LEFT JOIN products ps ON qx.quiz_type = 'product_mcq' AND ps.slug = qx.subject_slug
          LEFT JOIN products pi ON qx.quiz_type = 'product_mcq'
            AND qx.subject_slug REGEXP '^[0-9]+$' AND pi.id = CAST(qx.subject_slug AS UNSIGNED)
          WHERE qx.user_id = u.id AND qx.quiz_type = 'product_mcq'
         ) AS product_names_list,
         (SELECT GROUP_CONCAT(
            DISTINCT COALESCE(ts.title, ti.title, qy.subject_slug)
            ORDER BY COALESCE(ts.title, ti.title, qy.subject_slug) SEPARATOR ', ')
          FROM quiz_attempts qy
          LEFT JOIN course_topics ts ON qy.quiz_type = 'course_topic_quiz' AND ts.slug = qy.subject_slug
          LEFT JOIN course_topics ti ON qy.quiz_type = 'course_topic_quiz'
            AND qy.subject_slug REGEXP '^[0-9]+$' AND ti.id = CAST(qy.subject_slug AS UNSIGNED)
          WHERE qy.user_id = u.id AND qy.quiz_type = 'course_topic_quiz'
         ) AS course_names_list
       FROM users u
       LEFT JOIN quiz_attempts qa ON qa.user_id = u.id
       GROUP BY u.id, u.name, u.email, u.full_name, u.role
       ORDER BY u.name ASC`
    );

    const [attemptRows] = await db.query(
      `SELECT
         qa.id,
         qa.user_id,
         u.name AS user_name,
         u.email AS user_email,
         qa.quiz_type,
         qa.subject_slug,
         qa.score_correct,
         qa.score_total,
         qa.completed_at,
         ${QUIZ_SUBJECT_NAME_SQL}
       FROM quiz_attempts qa
       INNER JOIN users u ON u.id = qa.user_id
       ${QUIZ_SUBJECT_JOINS}
       ORDER BY qa.completed_at DESC
       LIMIT 400`
    );

    const users = userRows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      fullName: r.full_name,
      role: r.role,
      productQuizAttempts: Number(r.product_quiz_attempts ?? 0),
      courseQuizAttempts: Number(r.course_quiz_attempts ?? 0),
      lastProductAt: r.last_product_at,
      lastCourseAt: r.last_course_at,
      productAvgPercent: r.product_avg_percent != null ? Math.round(Number(r.product_avg_percent) * 10) / 10 : null,
      courseAvgPercent: r.course_avg_percent != null ? Math.round(Number(r.course_avg_percent) * 10) / 10 : null,
      productNamesList: r.product_names_list != null ? String(r.product_names_list) : null,
      courseNamesList: r.course_names_list != null ? String(r.course_names_list) : null,
    }));

    const attempts = attemptRows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      userEmail: r.user_email,
      quizType: r.quiz_type,
      subjectSlug: r.subject_slug,
      subjectName: r.subject_name != null ? String(r.subject_name) : r.subject_slug,
      scoreCorrect: Number(r.score_correct),
      scoreTotal: Number(r.score_total),
      completedAt: r.completed_at,
    }));

    res.json({ users, attempts });
  } catch (err) {
    console.error('quiz-attempts admin/overview:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
