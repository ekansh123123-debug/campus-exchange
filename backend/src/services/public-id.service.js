import crypto from 'node:crypto';

export const PUBLIC_ID_PREFIXES = Object.freeze({
  USER: 'CEU',
  LISTING: 'CEL',
  TRANSACTION: 'CET',
  RESOURCE: 'CER',
  REPORT: 'CERPT',
  CONVERSATION: 'CEC',
  NOTIFICATION: 'CEN',
});

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generatePublicCode(prefix, length = 8) {
  if (!prefix || typeof prefix !== 'string') {
    throw new Error('A valid prefix is required to generate a public code.');
  }
  const bytes = crypto.randomBytes(length);
  let suffix = '';
  for (let i = 0; i < length; i += 1) {
    suffix += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `${prefix}-${suffix}`;
}

export async function generateUniquePublicCode(Model, fieldName, prefix, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const code = generatePublicCode(prefix);
    const exists = await Model.exists({ [fieldName]: code });
    if (!exists) {
      return code;
    }
  }
  return `${prefix}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}
