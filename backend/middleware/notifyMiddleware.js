const { notifyFromRequest } = require('../services/notificationDispatch');

const ROUTE_PREFIXES = ['/api/findings', '/api/projects', '/api/users', '/api/wof', '/api/trending'];

function notifyMiddleware(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  if (req.originalUrl.startsWith('/api/notifications')) return next();
  if (req.originalUrl.startsWith('/api/auth')) return next();

  const originalJson = res.json.bind(res);

  res.json = function (body) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const cleanPath = req.originalUrl.split('?')[0];
      const matched = ROUTE_PREFIXES.find((p) => cleanPath === p || cleanPath.startsWith(`${p}/`));
      if (matched) {
        notifyFromRequest({
          req,
          body,
          matchedPrefix: matched,
          method: req.method,
        }).catch((err) => console.error('[Notify] dispatch failed:', err.message));
      }
    }

    return originalJson(body);
  };

  next();
}

module.exports = notifyMiddleware;
