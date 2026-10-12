import pino from 'pino';
import { env } from './env.js';

export const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'password',
  'passwordHash',
  '*.password',
  '*.passwordHash',
  '*.otp',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.signedUrl',
  '*.collegeEmail',
  '*.contactPreferences',
];

export const logger = pino({
  level: env.logLevel,
  redact: {
    paths: REDACT_PATHS,
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
