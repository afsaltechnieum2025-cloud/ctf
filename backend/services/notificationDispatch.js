const pool = require('../db');

async function getPrivilegedUserIds() {
  const [rows] = await pool.query(
    `SELECT id FROM users WHERE role IN ('admin', 'manager')`
  );
  return rows.map((r) => String(r.id));
}

async function getAssigneeUserIds(projectId) {
  if (!projectId) return [];
  const [rows] = await pool.query(
    'SELECT DISTINCT user_id FROM project_assignments WHERE project_id = ?',
    [projectId]
  );
  return rows.map((r) => String(r.user_id));
}

async function getProjectName(projectId) {
  if (!projectId) return null;
  const [rows] = await pool.query('SELECT name FROM projects WHERE id = ? LIMIT 1', [
    projectId,
  ]);
  return rows[0]?.name ?? null;
}

async function getUserDisplayLabel(userId) {
  if (!userId) return null;
  const [rows] = await pool.query(
    'SELECT name, full_name, email FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  const u = rows[0];
  if (!u) return String(userId);
  return u.full_name || u.name || u.email || String(userId);
}

/** Human-readable quiz subject (product name or topic title) for notifications. */
async function getQuizSubjectDisplayName(quizType, subjectSlug) {
  const s = String(subjectSlug || '').trim();
  if (!s) return 'Unknown quiz';
  const numeric = /^\d+$/.test(s);
  if (quizType === 'product_mcq') {
    const [rows] = numeric
      ? await pool.query('SELECT name FROM products WHERE id = ? LIMIT 1', [s])
      : await pool.query('SELECT name FROM products WHERE slug = ? LIMIT 1', [s]);
    return rows[0]?.name ?? s;
  }
  if (quizType === 'course_topic_quiz') {
    const [rows] = numeric
      ? await pool.query('SELECT title FROM course_topics WHERE id = ? LIMIT 1', [s])
      : await pool.query('SELECT title FROM course_topics WHERE slug = ? LIMIT 1', [s]);
    return rows[0]?.title ?? s;
  }
  return s;
}

async function insertForRecipients({ recipientUserIds, title, message, type }) {
  const unique = [...new Set((recipientUserIds || []).filter(Boolean))];
  if (!unique.length) return;
  await Promise.all(
    unique.map((uid) =>
      pool.execute('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)', [
        uid,
        title,
        message,
        type,
      ])
    )
  );
}

/**
 * Admins + managers always receive portal activity.
 * Salesteam users receive activity for projects they are assigned to, plus anything they did themselves (actor).
 */
async function resolveRecipientIds({ projectId, actorUserId }) {
  const set = new Set();
  (await getPrivilegedUserIds()).forEach((id) => set.add(id));
  if (projectId) {
    (await getAssigneeUserIds(projectId)).forEach((id) => set.add(id));
  }
  if (actorUserId) set.add(String(actorUserId));
  return [...set];
}

function verbPast(method) {
  const m = { POST: 'added', PUT: 'updated', PATCH: 'updated', DELETE: 'removed' };
  return m[method] || 'updated';
}

/**
 * @param {import('express').Request} req
 * @param {object} body - JSON body passed to res.json()
 * @param {string} matchedPrefix - e.g. '/api/users'
 * @param {string} method
 */
async function notifyFromRequest({ req, body, matchedPrefix, method }) {
  const cleanPath = req.originalUrl.split('?')[0];

  if (cleanPath.includes('/arch')) return;

  const actorId = req.user?.id ? String(req.user.id) : null;
  const actor = req.user?.name || req.user?.email || 'Someone';
  const verb = verbPast(method);

  // POST /api/quiz-attempts — who finished which quiz and score (body is response; use req.body)
  if (matchedPrefix === '/api/quiz-attempts') {
    const isBase =
      cleanPath === '/api/quiz-attempts' || cleanPath === '/api/quiz-attempts/';
    if (!isBase || method !== 'POST') return;
    const quizType = req.body?.quizType;
    const subjectSlug = req.body?.subjectSlug;
    const correct = Number(req.body?.scoreCorrect);
    const total = Number(req.body?.scoreTotal);
    if (typeof subjectSlug !== 'string' || !subjectSlug.trim() || !quizType) return;
    const subjectLabel = await getQuizSubjectDisplayName(quizType, subjectSlug);
    const typeLabel =
      quizType === 'product_mcq'
        ? 'Product quiz'
        : quizType === 'course_topic_quiz'
          ? 'Course topic quiz'
          : 'Quiz';
    const title = `${typeLabel} completed`;
    const scorePart =
      Number.isFinite(correct) && Number.isFinite(total) && total > 0
        ? `${correct}/${total}`
        : 'score recorded';
    const message = `${actor} completed "${subjectLabel}" (${scorePart}).`;
    const recipientIds = await resolveRecipientIds({ projectId: null, actorUserId: actorId });
    await insertForRecipients({
      recipientUserIds: recipientIds,
      title,
      message,
      type: 'quiz',
    });
    return;
  }

  const labelMap = {
    '/api/users': { noun: 'User', type: 'user' },
  };
  const label = labelMap[matchedPrefix];
  if (!label) return;

  let projectId =
    body?.project_id || body?.data?.project_id || req.body?.project_id || null;

  const userProjectPath = cleanPath.match(/^\/api\/users\/([^/]+)\/projects\/([^/]+)$/);
  if (matchedPrefix === '/api/users' && userProjectPath && method === 'DELETE') {
    projectId = projectId || userProjectPath[2];
  }

  let entityName =
    body?.name ||
    body?.title ||
    body?.data?.name ||
    body?.data?.title ||
    req.body?.name ||
    req.body?.title ||
    null;

  let title;
  let message;
  const type = label.type;

  // POST /api/users/:userId/projects (admin assign alternate path)
  const userProjectsPost = cleanPath.match(/^\/api\/users\/([^/]+)\/projects$/);
  if (matchedPrefix === '/api/users' && userProjectsPost && method === 'POST') {
    const targetUserId = userProjectsPost[1];
    const pid = req.body?.project_id || body?.project_id || null;
    const projName = pid ? await getProjectName(pid) : null;
    let targetLabel = targetUserId;
    const [ur] = await pool.query('SELECT name, full_name FROM users WHERE id = ? LIMIT 1', [
      targetUserId,
    ]);
    if (ur[0]) targetLabel = ur[0].full_name || ur[0].name || targetLabel;
    title = `Assignment: ${targetLabel} -> ${projName || 'project'}`;
    message = `${actor} assigned ${targetLabel} to project "${projName || 'Unknown project'}".`;
    const recipientIds = await resolveRecipientIds({ projectId: pid, actorUserId: actorId });
    recipientIds.push(String(targetUserId));
    await insertForRecipients({
      recipientUserIds: recipientIds,
      title,
      message,
      type: 'project',
    });
    return;
  }

  // DELETE /api/users/:userId/projects/:projectId
  if (matchedPrefix === '/api/users' && userProjectPath && method === 'DELETE') {
    const targetUserId = userProjectPath[1];
    const pid = userProjectPath[2];
    const projName = await getProjectName(pid);
    const targetLabel = await getUserDisplayLabel(targetUserId);
    title = 'Project unassigned';
    message = `${actor} removed ${targetLabel} from project "${projName || 'Unknown project'}".`;
    const recipientIds = await resolveRecipientIds({ projectId: pid, actorUserId: actorId });
    recipientIds.push(String(targetUserId));
    await insertForRecipients({
      recipientUserIds: recipientIds,
      title,
      message,
      type: 'project',
    });
    return;
  }

  const rolePutPath = cleanPath.match(/^\/api\/users\/([^/]+)\/role$/);
  if (matchedPrefix === '/api/users' && rolePutPath && method === 'PUT') {
    const targetUserId = rolePutPath[1];
    const newRole = req.body?.role ?? body?.role;
    const targetLabel = await getUserDisplayLabel(targetUserId);
    title = 'User role updated';
    message = `${actor} changed role for ${targetLabel} to ${newRole || 'unknown'}.`;
    const recipientIds = await resolveRecipientIds({ projectId: null, actorUserId: actorId });
    await insertForRecipients({ recipientUserIds: recipientIds, title, message, type: 'user' });
    return;
  }

  const singleUserDelete = cleanPath.match(/^\/api\/users\/([^/]+)$/);
  if (matchedPrefix === '/api/users' && singleUserDelete && method === 'DELETE') {
    const deletedId = singleUserDelete[1];
    title = 'User account removed';
    message = `${actor} deleted user account (ID ${deletedId}).`;
    const recipientIds = await resolveRecipientIds({ projectId: null, actorUserId: actorId });
    await insertForRecipients({ recipientUserIds: recipientIds, title, message, type: 'user' });
    return;
  }

  // POST /api/users — create user (response often has no name; use request body)
  if (
    matchedPrefix === '/api/users' &&
    (cleanPath === '/api/users' || cleanPath === '/api/users/') &&
    method === 'POST'
  ) {
    entityName =
      entityName ||
      [req.body?.full_name, req.body?.name].filter(Boolean).join(' ').trim() ||
      req.body?.email ||
      null;
  }

  // Default: users
  title = entityName ? `${label.noun} "${entityName}" ${verb}` : `${label.noun} ${verb}`;
  message = entityName
    ? `${actor} ${verb} ${label.noun.toLowerCase()} "${entityName}"`
    : `${actor} ${verb} a ${label.noun.toLowerCase()}`;

  const recipientIds = await resolveRecipientIds({ projectId, actorUserId: actorId });
  await insertForRecipients({ recipientUserIds: recipientIds, title, message, type });
}

module.exports = { notifyFromRequest, resolveRecipientIds, insertForRecipients };
