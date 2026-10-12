import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

function createLimiter({ windowMs, max, code, message }) {
  return rateLimit({
    windowMs,
    max: env.isTest ? max * 20 : max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: code || 'RATE_LIMIT_EXCEEDED',
          message: message || 'Too many requests, please try again later.',
          details: [],
          requestId: req.requestId || '',
        },
      });
    },
  });
}

export const authRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  code: 'AUTH_RATE_LIMIT',
  message: 'Too many authentication attempts. Please wait a few minutes and try again.',
});

export const verificationRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  code: 'VERIFICATION_RATE_LIMIT',
  message: 'Too many verification attempts. Please wait before trying again.',
});

export const chatMessageRateLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 30,
  code: 'CHAT_RATE_LIMIT',
  message: 'You are sending messages too quickly. Please slow down.',
});

export const uploadRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  code: 'UPLOAD_RATE_LIMIT',
  message: 'Too many file uploads in a short period. Please try again shortly.',
});

export const reportRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  code: 'REPORT_RATE_LIMIT',
  message: 'Too many reports submitted recently. Please wait before submitting another.',
});
