const pool = require('../db');

const FINDING_TYPE_LABEL = {
  pentest: 'Pentest',
  sast: 'SAST',
  asm: 'ASM',
  llm: 'LLM/AI',
  secret: 'Secret',
};

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
 * @param {string} matchedPrefix - e.g. '/api/findings'
 * @param {string} method
 */
async function notifyFromRequest({ req, body, matchedPrefix, method }) {
  const cleanPath = req.originalUrl.split('?')[0];

  if (cleanPath.includes('/arch')) return;

  const labelMap = {
    '/api/findings': { noun: 'Finding', type: 'finding' },
    '/api/projects': { noun: 'Project', type: 'project' },
    '/api/users': { noun: 'User', type: 'user' },
    '/api/wof': { noun: 'Wall of Fame entry', type: 'general' },
    '/api/trending': { noun: 'Trending note', type: 'general' },
  };
  const label = labelMap[matchedPrefix];
  if (!label) return;

  const actorId = req.user?.id ? String(req.user.id) : null;
  const actor = req.user?.name || req.user?.email || 'Someone';
  const verb = verbPast(method);

  let projectId =
    body?.project_id || body?.data?.project_id || req.body?.project_id || null;

  const findingUuidMatch = cleanPath.match(/^\/api\/findings\/([0-9a-fA-F-]{36})/i);
  let findingRow = null;
  if (matchedPrefix === '/api/findings' && findingUuidMatch) {
    const fid = findingUuidMatch[1];
    const [rows] = await pool.query(
      'SELECT project_id, title, finding_type FROM findings WHERE id = ? LIMIT 1',
      [fid]
    );
    findingRow = rows[0] || null;
    if (findingRow?.project_id) projectId = projectId || findingRow.project_id;
  }

  const projectUuidMatch = cleanPath.match(/^\/api\/projects\/([0-9a-fA-F-]{36})/i);
  if (matchedPrefix === '/api/projects' && projectUuidMatch) {
    projectId = projectId || projectUuidMatch[1];
  }
  if (matchedPrefix === '/api/projects' && method === 'POST' && body?.id) {
    projectId = projectId || body.id;
  }

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

  if (matchedPrefix === '/api/findings') {
    entityName = body?.title || findingRow?.title || entityName;
  }

  let title;
  let message;
  const type = label.type;

  // POST /api/projects/:id/assignments
  if (
    matchedPrefix === '/api/projects' &&
    cleanPath.includes('/assignments') &&
    method === 'POST'
  ) {
    const projName = await getProjectName(projectId);
    const assigneeId = req.body?.user_id;
    let assigneeLabel = assigneeId ? `user #${assigneeId}` : 'a tester';
    if (assigneeId) {
      const [urows] = await pool.query(
        'SELECT name, full_name FROM users WHERE id = ? LIMIT 1',
        [assigneeId]
      );
      const u = urows[0];
      if (u) assigneeLabel = u.full_name || u.name || assigneeLabel;
    }
    title = `Assignment: ${assigneeLabel} -> ${projName || 'project'}`;
    message = `${actor} assigned tester ${assigneeLabel} to project "${projName || 'Unknown project'}".`;
    const recipientIds = await resolveRecipientIds({ projectId, actorUserId: actorId });
    await insertForRecipients({ recipientUserIds: recipientIds, title, message, type });
    return;
  }

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

  // Findings: include tester name and finding title
  if (matchedPrefix === '/api/findings') {
    const bugTitle = entityName || 'Finding';
    const ft = String(body?.finding_type || req.body?.finding_type || findingRow?.finding_type || '')
      .toLowerCase();
    const typeLabel = FINDING_TYPE_LABEL[ft] || 'Finding';
    const projName = projectId ? await getProjectName(projectId) : null;
    const projectBit = projName ? ` on project "${projName}"` : '';

    if (cleanPath.includes('/pocs')) {
      const fname = body?.file_name || 'POC';
      title = `POC added: "${fname}"`;
      message = `Tester ${actor} uploaded a POC (${fname}) for finding "${bugTitle}"${projectBit}.`;
    } else if (method === 'POST') {
      title = `New ${typeLabel} finding: "${bugTitle}"`;
      message = `Tester ${actor} added ${typeLabel} finding "${bugTitle}"${projectBit}.`;
    } else if (method === 'DELETE') {
      title = `Finding removed: "${bugTitle}"`;
      message = `${actor} removed finding "${bugTitle}"${projectBit}.`;
    } else {
      title = `Finding updated: "${bugTitle}"`;
      message = `${actor} updated finding "${bugTitle}"${projectBit}.`;
    }

    const recipientIds = await resolveRecipientIds({ projectId, actorUserId: actorId });
    await insertForRecipients({ recipientUserIds: recipientIds, title, message, type });
    return;
  }

  // Default: users, projects, trending, wall of fame
  title = entityName ? `${label.noun} "${entityName}" ${verb}` : `${label.noun} ${verb}`;
  message = entityName
    ? `${actor} ${verb} ${label.noun.toLowerCase()} "${entityName}"`
    : `${actor} ${verb} a ${label.noun.toLowerCase()}`;

  const recipientIds = await resolveRecipientIds({ projectId, actorUserId: actorId });
  await insertForRecipients({ recipientUserIds: recipientIds, title, message, type });
}

module.exports = { notifyFromRequest, resolveRecipientIds, insertForRecipients };
