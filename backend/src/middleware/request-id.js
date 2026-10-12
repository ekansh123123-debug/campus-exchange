import crypto from 'node:crypto';

export function requestIdMiddleware(req, res, next) {
  const incomingId = req.headers['x-request-id'];
  const safeId =
    typeof incomingId === 'string' && /^[a-zA-Z0-9-_]{4,64}$/.test(incomingId)
      ? incomingId
      : crypto.randomUUID();
  req.requestId = safeId;
  res.setHeader('X-Request-Id', safeId);
  next();
}
