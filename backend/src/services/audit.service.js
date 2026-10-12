import { AuditEvent } from '../models/AuditEvent.model.js';
import { logger } from '../config/logger.js';

const FORBIDDEN_AUDIT_KEYS = new Set([
  'password',
  'passwordHash',
  'otp',
  'token',
  'accessToken',
  'refreshToken',
  'cookie',
  'authorization',
  'signedUrl',
]);

function sanitizeAuditMetadata(input) {
  if (!input || typeof input !== 'object') return {};
  const cleaned = {};
  for (const [key, val] of Object.entries(input)) {
    if (FORBIDDEN_AUDIT_KEYS.has(key)) {
      cleaned[key] = '[REDACTED]';
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      cleaned[key] = sanitizeAuditMetadata(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

export async function recordAuditEvent({
  actorId = null,
  actorRole = 'system',
  action,
  targetType,
  targetId,
  metadata = {},
  requestId = '',
}) {
  try {
    const safeMetadata = sanitizeAuditMetadata(metadata);
    const doc = await AuditEvent.create({
      actorId: actorId || null,
      actorRole: String(actorRole || 'system'),
      action: String(action),
      targetType: String(targetType),
      targetId: String(targetId),
      metadata: safeMetadata,
      requestId: String(requestId || ''),
    });
    return doc;
  } catch (err) {
    logger.warn({ event: 'audit_event_write_failed', action, reason: err.message });
    return null;
  }
}
