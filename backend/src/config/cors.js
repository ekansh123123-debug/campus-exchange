import { env } from './env.js';

export function isOriginAllowed(requestOrigin, allowedOrigins = []) {
  if (!requestOrigin) return true;
  const normalizedRequest = requestOrigin.trim().replace(/\/+$/, '').toLowerCase();

  return allowedOrigins.some((allowed) => {
    const target = allowed.trim().replace(/\/+$/, '').toLowerCase();
    if (!target) return false;
    if (target === '*' || target === normalizedRequest) {
      return true;
    }
    if (target.includes('*')) {
      const regexPattern =
        '^' +
        target
          .replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&')
          .replace(/\\\*/g, '.*') +
        '$';
      const regex = new RegExp(regexPattern, 'i');
      return regex.test(normalizedRequest);
    }
    return false;
  });
}

export function getCorsOptions() {
  const allowedOrigins = env.clientOrigin
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return {
    origin(requestOrigin, callback) {
      if (!requestOrigin) {
        return callback(null, true);
      }
      if (isOriginAllowed(requestOrigin, allowedOrigins)) {
        return callback(null, true);
      }
      const err = new Error(`Origin ${requestOrigin} not allowed by CORS policy`);
      err.statusCode = 403;
      err.code = 'CORS_ORIGIN_DENIED';
      return callback(err);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Request-Id',
      'x-csrf-token',
      'x-request-id',
    ],
    exposedHeaders: ['X-Request-Id'],
  };
}

