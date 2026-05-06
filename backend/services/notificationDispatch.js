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
 * Testers receive activity for projects they are assigned to, plus anything they did themselves (actor).
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

  const labelMap = {
    '/api/users': { noun: 'User', type: 'user' },
  };
  const label = labelMap[matchedPrefix];
  if (!label) return;

  const actorId = req.user?.id ? String(req.user.id) : null;
  const actor = req.user?.name || req.user?.email || 'Someone';
  const verb = verbPast(method);

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
    message = `${actor} assigned tester ${targetLabel} to project "${projName || 'Unknown project'}".`;
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

  // Default: users
  title = entityName ? `${label.noun} "${entityName}" ${verb}` : `${label.noun} ${verb}`;
  message = entityName
    ? `${actor} ${verb} ${label.noun.toLowerCase()} "${entityName}"`
    : `${actor} ${verb} a ${label.noun.toLowerCase()}`;

  const recipientIds = await resolveRecipientIds({ projectId, actorUserId: actorId });
  await insertForRecipients({ recipientUserIds: recipientIds, title, message, type });
}

module.exports = { notifyFromRequest, resolveRecipientIds, insertForRecipients };
