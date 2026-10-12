import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { RefreshSession } from '../models/RefreshSession.model.js';
import { AppError } from '../utils/app-error.js';

export function hashToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

export function generateNumericOtp(digits = 6) {
  const max = 10 ** digits;
  const min = 10 ** (digits - 1);
  return String(crypto.randomInt(min, max));
}

export function generateRandomToken(byteLength = 32) {
  return crypto.randomBytes(byteLength).toString('hex');
}

export function signAccessToken(user, sessionId = '') {
  const payload = {
    sub: String(user._id || user.id),
    role: user.role,
    sid: sessionId || crypto.randomUUID(),
    typ: 'access',
  };

  return jwt.sign(payload, env.jwtAccessSecret, {
    algorithm: 'HS256',
    expiresIn: env.jwtAccessTtl,
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });
}

export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret, {
      algorithms: ['HS256'],
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
    });
    if (!decoded || decoded.typ !== 'access' || !decoded.sub) {
      throw new AppError(401, 'INVALID_ACCESS_TOKEN', 'Invalid or malformed access token.');
    }
    return decoded;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication token is invalid or expired.');
  }
}

export async function createRefreshSession(userId, userAgent = '') {
  const rawRefreshToken = generateRandomToken(36);
  const csrfToken = generateRandomToken(24);
  const sessionId = crypto.randomUUID();
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + env.jwtRefreshTtlDays * 24 * 60 * 60 * 1000);

  await RefreshSession.create({
    userId,
    sessionId,
    tokenHash,
    expiresAt,
    userAgent: String(userAgent || '').slice(0, 300),
  });

  return {
    rawRefreshToken,
    csrfToken,
    sessionId,
    expiresAt,
  };
}

export async function rotateRefreshSession(rawRefreshToken, userAgent = '') {
  if (!rawRefreshToken) {
    throw new AppError(401, 'MISSING_REFRESH_TOKEN', 'Refresh session cookie is missing.');
  }

  const incomingHash = hashToken(rawRefreshToken);
  const existingSession = await RefreshSession.findOne({ tokenHash: incomingHash });

  if (!existingSession) {
    throw new AppError(401, 'INVALID_REFRESH_SESSION', 'Refresh session is invalid.');
  }

  if (existingSession.revokedAt || existingSession.expiresAt <= new Date()) {
    await RefreshSession.updateMany(
      { userId: existingSession.userId, revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: 'refresh_token_reuse_or_expired' } }
    );
    throw new AppError(401, 'REVOKED_REFRESH_SESSION', 'Refresh session has expired or was revoked.');
  }

  const nextRawRefreshToken = generateRandomToken(36);
  const nextCsrfToken = generateRandomToken(24);
  const nextSessionId = crypto.randomUUID();
  const nextTokenHash = hashToken(nextRawRefreshToken);
  const nextExpiresAt = new Date(Date.now() + env.jwtRefreshTtlDays * 24 * 60 * 60 * 1000);

  existingSession.revokedAt = new Date();
  existingSession.replacedBySessionId = nextSessionId;
  existingSession.revokeReason = 'rotated';
  await existingSession.save();

  await RefreshSession.create({
    userId: existingSession.userId,
    sessionId: nextSessionId,
    tokenHash: nextTokenHash,
    expiresAt: nextExpiresAt,
    userAgent: String(userAgent || '').slice(0, 300),
  });

  return {
    userId: existingSession.userId,
    rawRefreshToken: nextRawRefreshToken,
    csrfToken: nextCsrfToken,
    sessionId: nextSessionId,
    expiresAt: nextExpiresAt,
  };
}

export async function revokeRefreshToken(rawRefreshToken, reason = 'logout') {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  await RefreshSession.updateOne(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date(), revokeReason: reason } }
  );
}

export async function revokeAllUserSessions(userId, reason = 'security_revocation') {
  await RefreshSession.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date(), revokeReason: reason } }
  );
}

export function setAuthCookies(res, rawRefreshToken, csrfToken, expiresAt) {
  const sameSite = ['strict', 'lax', 'none'].includes(String(env.cookieSameSite).toLowerCase())
    ? String(env.cookieSameSite).toLowerCase()
    : 'strict';

  res.cookie(env.refreshCookieName, rawRefreshToken, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite,
    expires: expiresAt,
    path: '/api/v1/auth',
  });

  res.cookie(env.csrfCookieName, csrfToken, {
    httpOnly: false,
    secure: env.cookieSecure,
    sameSite,
    expires: expiresAt,
    path: '/',
  });
}

export function clearAuthCookies(res) {
  const sameSite = ['strict', 'lax', 'none'].includes(String(env.cookieSameSite).toLowerCase())
    ? String(env.cookieSameSite).toLowerCase()
    : 'strict';

  res.clearCookie(env.refreshCookieName, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite,
    path: '/api/v1/auth',
  });

  res.clearCookie(env.csrfCookieName, {
    httpOnly: false,
    secure: env.cookieSecure,
    sameSite,
    path: '/',
  });
}
