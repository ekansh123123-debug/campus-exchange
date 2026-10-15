import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { ROLES } from '../../constants/roles.js';
import { ACCOUNT_STATUS } from '../../constants/account-status.js';
import { User } from '../../models/User.model.js';
import { EmailVerification } from '../../models/EmailVerification.model.js';
import {
  generateUniquePublicCode,
  PUBLIC_ID_PREFIXES,
} from '../../services/public-id.service.js';
import {
  createRefreshSession,
  generateNumericOtp,
  hashToken,
  revokeAllUserSessions,
  revokeRefreshToken,
  rotateRefreshSession,
  signAccessToken,
} from '../../services/token.service.js';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../../services/email.service.js';
import { createNotification } from '../../services/notification.service.js';
import { recordAuditEvent } from '../../services/audit.service.js';
import { AppError } from '../../utils/app-error.js';
import { toSafeCurrentUser } from '../../utils/safe-user.js';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function assertAllowedCollegeDomain(normalizedEmail) {
  const parts = normalizedEmail.split('@');
  if (parts.length !== 2 || !parts[1]) {
    throw new AppError(400, 'INVALID_EMAIL', 'Please provide a valid college email address.');
  }
  const domain = parts[1].toLowerCase();
  if (!env.collegeEmailDomains.includes(domain)) {
    throw new AppError(
      400,
      'INVALID_COLLEGE_EMAIL_DOMAIN',
      `Registration is restricted to verified college email domains (${env.collegeEmailDomains.join(', ')}).`
    );
  }
}

export async function registerStudent(payload, requestId = '') {
  const collegeEmail = normalizeEmail(payload.collegeEmail);
  assertAllowedCollegeDomain(collegeEmail);

  const existing = await User.findOne({ collegeEmail });
  if (existing) {
    throw new AppError(
      409,
      'EMAIL_ALREADY_REGISTERED',
      'An account with this college email address is already registered.'
    );
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const userCode = await generateUniquePublicCode(User, 'userCode', PUBLIC_ID_PREFIXES.USER);

  let user = null;
  try {
    user = await User.create({
      userCode,
      fullName: payload.fullName.trim(),
      collegeEmail,
      passwordHash,
      role: ROLES.STUDENT,
      emailVerifiedAt: null,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      branch: payload.branch || 'GENERAL',
      academicYear: payload.academicYear || '1',
    });

    const otpCode = generateNumericOtp(6);
    const now = Date.now();
    await EmailVerification.create({
      userId: user._id,
      purpose: 'email_verification',
      tokenHash: hashToken(otpCode),
      expiresAt: new Date(now + env.otpExpiryMinutes * 60 * 1000),
      attemptCount: 0,
      resendAvailableAt: new Date(now + env.otpResendCooldownSeconds * 1000),
    });

    await sendVerificationEmail({
      toEmail: user.collegeEmail,
      fullName: user.fullName,
      otpCode,
    });

    await recordAuditEvent({
      actorId: user._id,
      actorRole: ROLES.STUDENT,
      action: 'user.registered',
      targetType: 'user',
      targetId: user.userCode,
      requestId,
    });

    return {
      user: toSafeCurrentUser(user),
      verificationRequired: true,
    };
  } catch (err) {
    if (user && !user.emailVerifiedAt) {
      await User.deleteOne({ _id: user._id }).catch(() => {});
      await EmailVerification.deleteMany({ userId: user._id }).catch(() => {});
    }
    throw err;
  }
}

export async function verifyStudentEmail({ collegeEmail, otp }, requestId = '') {
  const normalizedEmail = normalizeEmail(collegeEmail);
  const user = await User.findOne({ collegeEmail: normalizedEmail });

  if (!user) {
    throw new AppError(400, 'INVALID_VERIFICATION_REQUEST', 'Invalid email or verification code.');
  }

  if (user.emailVerifiedAt) {
    throw new AppError(409, 'ALREADY_VERIFIED', 'This email address is already verified.');
  }

  const record = await EmailVerification.findOne({
    userId: user._id,
    purpose: 'email_verification',
    consumedAt: null,
  }).sort({ createdAt: -1 });

  if (!record) {
    throw new AppError(
      400,
      'VERIFICATION_NOT_FOUND',
      'No active verification code found. Please request a new code.'
    );
  }

  if (record.expiresAt <= new Date()) {
    throw new AppError(
      400,
      'OTP_EXPIRED',
      'Verification code has expired. Please request a new code.'
    );
  }

  if (record.attemptCount >= env.otpMaxAttempts) {
    throw new AppError(
      429,
      'OTP_MAX_ATTEMPTS_EXCEEDED',
      'Maximum verification attempts exceeded. Please request a new code.'
    );
  }

  const candidateHash = hashToken(otp);
  if (candidateHash !== record.tokenHash) {
    record.attemptCount += 1;
    await record.save();
    throw new AppError(400, 'INVALID_OTP', 'The verification code entered is incorrect.');
  }

  const consumed = await EmailVerification.findOneAndUpdate(
    { _id: record._id, consumedAt: null },
    { $set: { consumedAt: new Date() } },
    { returnDocument: 'after' }
  );

  if (!consumed) {
    throw new AppError(400, 'OTP_ALREADY_USED', 'This verification code has already been used.');
  }

  user.emailVerifiedAt = new Date();
  await user.save();

  await createNotification({
    userId: user._id,
    eventType: 'email_verified',
    title: 'College Email Verified',
    body: 'Your college email has been verified. You now have full access to CampusExchange.',
    linkPath: '/app',
  });

  await recordAuditEvent({
    actorId: user._id,
    actorRole: user.role,
    action: 'user.email_verified',
    targetType: 'user',
    targetId: user.userCode,
    requestId,
  });

  return {
    user: toSafeCurrentUser(user),
  };
}

export async function resendVerificationCode({ collegeEmail }) {
  const normalizedEmail = normalizeEmail(collegeEmail);
  const user = await User.findOne({ collegeEmail: normalizedEmail });

  if (!user || user.emailVerifiedAt) {
    return {
      message: 'If the account is eligible for verification, a new code has been sent.',
    };
  }

  const latest = await EmailVerification.findOne({
    userId: user._id,
    purpose: 'email_verification',
    consumedAt: null,
  }).sort({ createdAt: -1 });

  const now = Date.now();
  if (latest && latest.resendAvailableAt > new Date(now)) {
    const waitSeconds = Math.ceil((latest.resendAvailableAt.getTime() - now) / 1000);
    throw new AppError(
      429,
      'RESEND_COOLDOWN_ACTIVE',
      `Please wait ${waitSeconds} seconds before requesting another verification code.`
    );
  }

  await EmailVerification.updateMany(
    { userId: user._id, purpose: 'email_verification', consumedAt: null },
    { $set: { consumedAt: new Date() } }
  );

  const otpCode = generateNumericOtp(6);
  await EmailVerification.create({
    userId: user._id,
    purpose: 'email_verification',
    tokenHash: hashToken(otpCode),
    expiresAt: new Date(now + env.otpExpiryMinutes * 60 * 1000),
    attemptCount: 0,
    resendAvailableAt: new Date(now + env.otpResendCooldownSeconds * 1000),
  });

  await sendVerificationEmail({
    toEmail: user.collegeEmail,
    fullName: user.fullName,
    otpCode,
  });

  return {
    message: 'If the account is eligible for verification, a new code has been sent.',
  };
}

export async function loginUser({ collegeEmail, password }, userAgent = '') {
  const normalizedEmail = normalizeEmail(collegeEmail);
  const user = await User.findOne({ collegeEmail: normalizedEmail }).select('+passwordHash');

  if (!user || user.accountStatus === ACCOUNT_STATUS.DELETED) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid college email or password.');
  }

  const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordMatch) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid college email or password.');
  }

  if (user.accountStatus === ACCOUNT_STATUS.BLOCKED) {
    throw new AppError(
      403,
      'ACCOUNT_BLOCKED',
      'Your account has been suspended by an administrator.'
    );
  }

  const session = await createRefreshSession(user._id, userAgent);
  const accessToken = signAccessToken(user, session.sessionId);

  return {
    user: toSafeCurrentUser(user),
    accessToken,
    csrfToken: session.csrfToken,
    rawRefreshToken: session.rawRefreshToken,
    refreshExpiresAt: session.expiresAt,
  };
}

export async function refreshUserSession(rawRefreshToken, userAgent = '') {
  const rotated = await rotateRefreshSession(rawRefreshToken, userAgent);
  const user = await User.findById(rotated.userId);

  if (!user || user.accountStatus === ACCOUNT_STATUS.DELETED) {
    await revokeAllUserSessions(rotated.userId, 'user_deleted');
    throw new AppError(401, 'UNAUTHORIZED', 'Account is no longer available.');
  }

  if (user.accountStatus === ACCOUNT_STATUS.BLOCKED) {
    await revokeAllUserSessions(rotated.userId, 'user_blocked');
    throw new AppError(
      403,
      'ACCOUNT_BLOCKED',
      'Your account has been suspended by an administrator.'
    );
  }

  const accessToken = signAccessToken(user, rotated.sessionId);

  return {
    user: toSafeCurrentUser(user),
    accessToken,
    csrfToken: rotated.csrfToken,
    rawRefreshToken: rotated.rawRefreshToken,
    refreshExpiresAt: rotated.expiresAt,
  };
}

export async function logoutUserSession(rawRefreshToken) {
  await revokeRefreshToken(rawRefreshToken, 'user_logout');
}

export async function getCurrentUserProfile(userId) {
  const user = await User.findById(userId);
  if (!user || user.accountStatus === ACCOUNT_STATUS.DELETED) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User account not found.');
  }
  return toSafeCurrentUser(user);
}

export async function requestPasswordReset({ collegeEmail }) {
  const normalizedEmail = normalizeEmail(collegeEmail);
  const user = await User.findOne({ collegeEmail: normalizedEmail });

  if (user && user.accountStatus === ACCOUNT_STATUS.ACTIVE) {
    await EmailVerification.updateMany(
      { userId: user._id, purpose: 'password_reset', consumedAt: null },
      { $set: { consumedAt: new Date() } }
    );

    const resetToken = generateNumericOtp(6);
    const now = Date.now();
    await EmailVerification.create({
      userId: user._id,
      purpose: 'password_reset',
      tokenHash: hashToken(resetToken),
      expiresAt: new Date(now + env.otpExpiryMinutes * 60 * 1000),
      attemptCount: 0,
      resendAvailableAt: new Date(now + env.otpResendCooldownSeconds * 1000),
    });

    await sendPasswordResetEmail({
      toEmail: user.collegeEmail,
      fullName: user.fullName,
      resetToken,
    });
  }

  return {
    message: 'If an account matches that college email, password reset instructions have been sent.',
  };
}

export async function resetUserPassword({ collegeEmail, token, newPassword }, requestId = '') {
  const normalizedEmail = normalizeEmail(collegeEmail);
  const user = await User.findOne({ collegeEmail: normalizedEmail }).select('+passwordHash');

  if (!user || user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    throw new AppError(400, 'INVALID_RESET_TOKEN', 'Invalid or expired password reset token.');
  }

  const record = await EmailVerification.findOne({
    userId: user._id,
    purpose: 'password_reset',
    consumedAt: null,
  }).sort({ createdAt: -1 });

  if (!record || record.expiresAt <= new Date() || record.attemptCount >= env.otpMaxAttempts) {
    throw new AppError(400, 'INVALID_RESET_TOKEN', 'Invalid or expired password reset token.');
  }

  if (hashToken(token) !== record.tokenHash) {
    record.attemptCount += 1;
    await record.save();
    throw new AppError(400, 'INVALID_RESET_TOKEN', 'Invalid or expired password reset token.');
  }

  record.consumedAt = new Date();
  await record.save();

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  await revokeAllUserSessions(user._id, 'password_reset');

  await recordAuditEvent({
    actorId: user._id,
    actorRole: user.role,
    action: 'user.password_reset',
    targetType: 'user',
    targetId: user.userCode,
    requestId,
  });

  return {
    message: 'Your password has been reset successfully. Please sign in with your new password.',
  };
}
