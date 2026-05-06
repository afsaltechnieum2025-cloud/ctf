const express  = require('express');
const router   = express.Router();
const db       = require('../db');
const multer   = require('multer');

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB — increased for HEIC from phones
  fileFilter: (req, file, cb) => {
    // Accept all image types including HEIC/HEIF from iPhones
    const allowed = /image\//i;
    const allowedExt = /\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|heif)$/i;
    if (allowed.test(file.mimetype) || allowedExt.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(null, false); // silently skip instead of error
    }
  },
});

// ─── Run once: add category column if it doesn't exist ───────────────────────
// You can also run this SQL manually:
// ALTER TABLE trending_notes ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'others';
(async () => {
  try {
    await db.query(`
      ALTER TABLE trending_notes
      ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'others'
    `);
  } catch (e) {
    // Column may already exist — safe to ignore
  }
  try {
    await db.query(`
      ALTER TABLE trending_notes
      ADD COLUMN IF NOT EXISTS created_by INT NULL
    `);
  } catch (e) {
    // Column may already exist — safe to ignore
  }
})();

// ─── Validation (mirror frontend trending note rules) ─────────────────────────
const NOTE_TITLE_RE = /^[^<>\u0000-\u001F\u007F]{2,120}$/;
const NOTE_LINK_RE = /^https?:\/\/\S+$/i;
const NOTE_DESC_MIN = 10;
const NOTE_DESC_MAX = 8000;
const NOTE_LINK_MAX = 2048;

/** @returns {string|null} error message or null if OK */
function validateTrendingPayload(body) {
  const name = String(body.name ?? '').trim();
  const description = String(body.description ?? '').trim();
  const link = String(body.link ?? '').trim();

  if (!name || !description) return 'Name and description are required';
  if (!NOTE_TITLE_RE.test(name)) {
    return 'Invalid name: 2–120 characters; no <, >, or control characters.';
  }
  if (description.length < NOTE_DESC_MIN) {
    return `Description must be at least ${NOTE_DESC_MIN} characters`;
  }
  if (description.length > NOTE_DESC_MAX) {
    return `Description must be at most ${NOTE_DESC_MAX} characters`;
  }
  if (description.includes('\0')) return 'Invalid description';

  if (link) {
    if (link.length > NOTE_LINK_MAX) return `Link must be at most ${NOTE_LINK_MAX} characters`;
    if (!NOTE_LINK_RE.test(link)) return 'Link must be a valid http(s) URL with no spaces';
    try {
      const u = new URL(link);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'Link must use http or https';
    } catch {
      return 'Invalid link URL';
    }
  }

  return null;
}

// ─── GET all notes ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*,
              COALESCE(
                NULLIF(TRIM(u.full_name), ''),
                NULLIF(TRIM(u.name), ''),
                NULLIF(TRIM(u.email), '')
              ) AS added_by_name
       FROM trending_notes t
       LEFT JOIN users u ON u.id = t.created_by
       ORDER BY t.created_at DESC`,
    );
    const notes = rows.map((row) => ({
      ...row,
      category: row.category || 'others',
      added_by_name: row.added_by_name || null,
      photoPreview: row.photo
        ? `data:${row.photo_mimetype || 'image/png'};base64,${Buffer.from(row.photo).toString('base64')}`
        : null,
    }));
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST new note ────────────────────────────────────────────────────────────
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const name = String(req.body.name ?? '').trim();
    const link = String(req.body.link ?? '').trim();
    const description = String(req.body.description ?? '').trim();
    const { category } = req.body;

    const invalid = validateTrendingPayload({ name, link, description });
    if (invalid) return res.status(400).json({ error: invalid });

    const photo          = req.file ? req.file.buffer   : null;
    const photo_mimetype = req.file ? req.file.mimetype : null;
    const cat = category || 'others';
    const rawUserId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    let createdBy = null;
    if (rawUserId != null && String(rawUserId).trim() !== '') {
      const n = Number(rawUserId);
      createdBy = Number.isFinite(n) ? n : null;
    }

    const [result] = await db.query(
      'INSERT INTO trending_notes (name, link, description, photo, photo_mimetype, category, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, link || null, description, photo, photo_mimetype, cat, createdBy],
    );
    const insertId = result.insertId;
    const [[summary]] = await db.query(
      `SELECT COALESCE(
         NULLIF(TRIM(u.full_name), ''),
         NULLIF(TRIM(u.name), ''),
         NULLIF(TRIM(u.email), '')
       ) AS added_by_name
       FROM trending_notes t
       LEFT JOIN users u ON u.id = t.created_by
       WHERE t.id = ?`,
      [insertId],
    );
    res.json({
      id: insertId,
      message: 'Note saved',
      added_by_name: summary?.added_by_name || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT (edit) note ──────────────────────────────────────────────────────────
router.put('/:id', upload.single('photo'), async (req, res) => {
  try {
    const name = String(req.body.name ?? '').trim();
    const link = String(req.body.link ?? '').trim();
    const description = String(req.body.description ?? '').trim();
    const { category } = req.body;
    const { id } = req.params;

    const invalid = validateTrendingPayload({ name, link, description });
    if (invalid) return res.status(400).json({ error: invalid });

    const cat = category || 'others';

    if (req.file) {
      await db.query(
        'UPDATE trending_notes SET name=?, link=?, description=?, photo=?, photo_mimetype=?, category=? WHERE id=?',
        [name, link || null, description, req.file.buffer, req.file.mimetype, cat, id]
      );
    } else {
      await db.query(
        'UPDATE trending_notes SET name=?, link=?, description=?, category=? WHERE id=?',
        [name, link || null, description, cat, id]
      );
    }
    res.json({ message: 'Note updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE note ──────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM trending_notes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;