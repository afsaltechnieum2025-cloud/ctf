const express = require('express');
const router = express.Router();
const db = require('../db');

/** @param {unknown} v */
function asStringArray(v) {
  if (Array.isArray(v)) return v.map(String);
  if (v == null) return [];
  try {
    const parsed = typeof v === 'string' ? JSON.parse(v) : v;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

// ── GET /api/learning/products ───────────────────────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT slug, name, url, image, description
       FROM products
       ORDER BY sort_order ASC, id ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/learning/course-topics ──────────────────────────────────────────
router.get('/course-topics', async (req, res) => {
  try {
    const [topics] = await db.query(
      `SELECT id, slug, title, tagline, summary
       FROM course_topics
       ORDER BY sort_order ASC, id ASC`
    );

    if (!topics.length) {
      return res.json([]);
    }

    const topicIds = topics.map((t) => t.id);

    const [sections] = await db.query(
      `SELECT topic_id, heading, paragraphs, sort_order
       FROM course_topic_sections
       WHERE topic_id IN (?)
       ORDER BY topic_id ASC, sort_order ASC, id ASC`,
      [topicIds]
    );

    const [links] = await db.query(
      `SELECT ctp.topic_id, p.slug
       FROM course_topic_products ctp
       INNER JOIN products p ON p.id = ctp.product_id
       WHERE ctp.topic_id IN (?)
       ORDER BY ctp.topic_id ASC, ctp.sort_order ASC, p.id ASC`,
      [topicIds]
    );

    const sectionsByTopic = new Map();
    for (const s of sections) {
      if (!sectionsByTopic.has(s.topic_id)) sectionsByTopic.set(s.topic_id, []);
      sectionsByTopic.get(s.topic_id).push({
        heading: s.heading,
        paragraphs: asStringArray(s.paragraphs),
      });
    }

    const slugsByTopic = new Map();
    for (const row of links) {
      if (!slugsByTopic.has(row.topic_id)) slugsByTopic.set(row.topic_id, []);
      slugsByTopic.get(row.topic_id).push(row.slug);
    }

    const payload = topics.map((t) => ({
      slug: t.slug,
      title: t.title,
      tagline: t.tagline,
      summary: t.summary,
      relatedProductSlugs: slugsByTopic.get(t.id) ?? [],
      sections: sectionsByTopic.get(t.id) ?? [],
    }));

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/learning/product-mcqs/:productSlug ──────────────────────────────
router.get('/product-mcqs/:productSlug', async (req, res) => {
  try {
    const slug = req.params.productSlug;
    const [rows] = await db.query(
      `SELECT q.question, q.options, q.correct_index, q.sort_order
       FROM product_mcq_questions q
       INNER JOIN products p ON p.id = q.product_id
       WHERE p.slug = ?
       ORDER BY q.sort_order ASC, q.id ASC`,
      [slug]
    );

    const questions = rows.map((r) => ({
      question: r.question || undefined,
      options: asStringArray(r.options),
      correctIndex: Number(r.correct_index),
    }));

    res.json({ slug, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/learning/topic-quiz/:topicSlug ──────────────────────────────────
router.get('/topic-quiz/:topicSlug', async (req, res) => {
  try {
    const slug = req.params.topicSlug;
    const [rows] = await db.query(
      `SELECT q.question, q.options, q.correct_index, q.sort_order
       FROM course_topic_quiz_questions q
       INNER JOIN course_topics t ON t.id = q.topic_id
       WHERE t.slug = ?
       ORDER BY q.sort_order ASC, q.id ASC`,
      [slug]
    );

    const opts = rows.map((r) => {
      const arr = asStringArray(r.options);
      const four = [arr[0] ?? '', arr[1] ?? '', arr[2] ?? '', arr[3] ?? ''];
      return {
        question: r.question,
        options: four,
        correctIndex: Number(r.correct_index),
      };
    });

    res.json({ slug, questions: opts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
