import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), '../.env'), quiet: true });

function parseBoolean(val, fallback) {
  if (val === undefined || val === '') return fallback;
  return String(val).toLowerCase() === 'true' || String(val) === '1';
}

function parseNumber(val, fallback, min = 1, max = Number.MAX_SAFE_INTEGER) {
  if (val === undefined || val === '') return fallback;
  const parsed = Number(val);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return fallback;
  }
  return parsed;
}

export function loadEnv(rawEnv = process.env) {
  const nodeEnv = rawEnv.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';

  if (isProd) {
    if (!rawEnv.JWT_ACCESS_SECRET || rawEnv.JWT_ACCESS_SECRET.includes('replace-with')) {
      throw new Error('Production configuration error: valid JWT_ACCESS_SECRET is required.');
    }
    if (!rawEnv.JWT_REFRESH_SECRET || rawEnv.JWT_REFRESH_SECRET.includes('replace-with')) {
      throw new Error('Production configuration error: valid JWT_REFRESH_SECRET is required.');
    }
    if (!rawEnv.MONGODB_URI) {
      throw new Error('Production configuration error: MONGODB_URI is required.');
    }
  }

  const rawDomains = rawEnv.COLLEGE_EMAIL_DOMAINS || 'nitk.edu.in,campus.edu,example.edu';
  const collegeEmailDomains = rawDomains
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  if (collegeEmailDomains.length === 0) {
    throw new Error('At least one domain must be configured in COLLEGE_EMAIL_DOMAINS.');
  }

  const maxImageSizeMb = parseNumber(rawEnv.MAX_IMAGE_SIZE_MB, 5, 1, 25);
  const maxResourceSizeMb = parseNumber(rawEnv.MAX_RESOURCE_SIZE_MB, 20, 1, 100);

    const smtpUser = String(rawEnv.SMTP_USER || '').trim();
    const smtpService = String(rawEnv.SMTP_SERVICE || '').trim().toLowerCase();
    let smtpHost = String(rawEnv.SMTP_HOST || '').trim();

    if (!smtpHost && (smtpService === 'gmail' || smtpUser.toLowerCase().endsWith('@gmail.com'))) {
      smtpHost = 'smtp.gmail.com';
    }

    const isGmail = smtpService === 'gmail' || smtpHost === 'smtp.gmail.com' || smtpUser.toLowerCase().endsWith('@gmail.com');

    const rawSmtpPass = String(rawEnv.SMTP_PASS || '').trim();
    // Strip surrounding quotes and whitespace if user copied Google App Password
    const unquotedPass = rawSmtpPass.replace(/^["']|["']$/g, '').trim();
    const smtpPass = isGmail ? unquotedPass.replace(/\s+/g, '') : unquotedPass;

    const resendApiKey = String(rawEnv.RESEND_API_KEY || '').trim();

    const emailFrom =
      rawEnv.EMAIL_FROM ||
      (smtpUser ? `CampusExchange <${smtpUser}>` : 'CampusExchange <no-reply@campus.edu>');

    return Object.freeze({
      nodeEnv,
      isProd,
      isTest,
      port: parseNumber(rawEnv.PORT, 5000, 1, 65535),
      clientOrigin:
        rawEnv.CLIENT_ORIGIN ||
        'https://campus-exchange-eta.vercel.app,http://localhost:5173,http://localhost:4173',
      apiBaseUrl: rawEnv.API_BASE_URL || 'http://localhost:5000/api/v1',
      mongodbUri: rawEnv.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_exchange',
      useInMemoryDbIfUnavailable: parseBoolean(rawEnv.USE_IN_MEMORY_DB_IF_UNAVAILABLE, !isProd),
      collegeEmailDomains,
      jwtAccessSecret:
        rawEnv.JWT_ACCESS_SECRET || 'dev-campus-exchange-access-secret-key-min-32-chars',
      jwtRefreshSecret:
        rawEnv.JWT_REFRESH_SECRET || 'dev-campus-exchange-refresh-secret-key-min-32-chars',
      jwtAccessTtl: rawEnv.JWT_ACCESS_TTL || '15m',
      jwtRefreshTtlDays: parseNumber(rawEnv.JWT_REFRESH_TTL_DAYS, 14, 1, 90),
      jwtIssuer: rawEnv.JWT_ISSUER || 'campus-exchange-api',
      jwtAudience: rawEnv.JWT_AUDIENCE || 'campus-exchange-client',
      cookieSecure: parseBoolean(rawEnv.COOKIE_SECURE, isProd),
      cookieSameSite: rawEnv.COOKIE_SAME_SITE || (isProd ? 'none' : 'strict'),
      refreshCookieName: rawEnv.REFRESH_COOKIE_NAME || 'ce_refresh',
      csrfCookieName: rawEnv.CSRF_COOKIE_NAME || 'ce_csrf',
      emailFrom,
      smtpService,
      smtpHost,
      smtpPort: parseNumber(rawEnv.SMTP_PORT, 587, 1, 65535),
      smtpSecure: parseBoolean(rawEnv.SMTP_SECURE, false),
      smtpUser,
      smtpPass,
      resendApiKey,
      imagekitPublicKey: rawEnv.IMAGEKIT_PUBLIC_KEY || '',
      imagekitPrivateKey: rawEnv.IMAGEKIT_PRIVATE_KEY || '',
      imagekitUrlEndpoint: rawEnv.IMAGEKIT_URL_ENDPOINT || '',
      imagekitResourceFolder: rawEnv.IMAGEKIT_RESOURCE_FOLDER || '/campus-exchange/resources',
      imagekitListingFolder: rawEnv.IMAGEKIT_LISTING_FOLDER || '/campus-exchange/listings',
    maxListingImages: parseNumber(rawEnv.MAX_LISTING_IMAGES, 6, 1, 12),
    maxImageSizeMb,
    maxImageSizeBytes: maxImageSizeMb * 1024 * 1024,
    maxResourceSizeMb,
    maxResourceSizeBytes: maxResourceSizeMb * 1024 * 1024,
    reservationExpiryHours: parseNumber(rawEnv.RESERVATION_EXPIRY_HOURS, 48, 1, 336),
    otpExpiryMinutes: parseNumber(rawEnv.OTP_EXPIRY_MINUTES, 15, 1, 120),
    otpMaxAttempts: parseNumber(rawEnv.OTP_MAX_ATTEMPTS, 5, 1, 20),
    otpResendCooldownSeconds: parseNumber(rawEnv.OTP_RESEND_COOLDOWN_SECONDS, 60, 0, 3600),
    logLevel: isTest ? rawEnv.TEST_LOG_LEVEL || 'silent' : rawEnv.LOG_LEVEL || 'info',
  });
}

export const env = loadEnv();
