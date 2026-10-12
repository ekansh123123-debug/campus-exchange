import { env } from './env.js';

export function getCorsOptions() {
  const allowedOrigins = env.clientOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return {
    origin(requestOrigin, callback) {
      if (!requestOrigin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(requestOrigin)) {
        return callback(null, true);
      }
      const err = new Error('Origin not allowed by CORS policy');
      err.statusCode = 403;
      err.code = 'CORS_ORIGIN_DENIED';
      return callback(err);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  };
}
