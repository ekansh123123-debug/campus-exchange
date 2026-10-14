import { env } from '../config/env.js';
import { isOriginAllowed } from '../config/cors.js';
import { AppError } from '../utils/app-error.js';

export function requireCsrfProtection(req, _res, next) {
  const allowedOrigins = env.clientOrigin
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (origin && !isOriginAllowed(origin, allowedOrigins)) {
    return next(new AppError(403, 'CSRF_ORIGIN_MISMATCH', 'Request origin is not permitted.'));
  }

  if (!origin && referer) {
    let refererOrigin = '';
    try {
      refererOrigin = new URL(referer).origin;
    } catch {
      refererOrigin = referer;
    }
    if (!isOriginAllowed(refererOrigin, allowedOrigins)) {
      return next(new AppError(403, 'CSRF_REFERER_MISMATCH', 'Request referer is not permitted.'));
    }
  }

  const csrfCookie = req.cookies?.[env.csrfCookieName];
  const csrfHeader = req.headers['x-csrf-token'];

  if (csrfCookie) {
    if (!csrfHeader || typeof csrfHeader !== 'string' || csrfHeader !== csrfCookie) {
      return next(
        new AppError(403, 'CSRF_TOKEN_INVALID', 'Missing or invalid CSRF security token.')
      );
    }
  }

  return next();
}
