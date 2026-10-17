import { env } from '../../config/env.js';
import {
  clearAuthCookies,
  setAuthCookies,
} from '../../services/token.service.js';
import { getDevMailForRecipient } from '../../services/email.service.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { sendSuccess } from '../../utils/api-response.js';
import { AppError } from '../../utils/app-error.js';
import {
  getCurrentUserProfile,
  loginUser,
  logoutUserSession,
  refreshUserSession,
  registerStudent,
  requestPasswordReset,
  resendVerificationCode,
  resetUserPassword,
  verifyStudentEmail,
} from './auth.service.js';

export const registerController = asyncHandler(async (req, res) => {
  const result = await registerStudent(req.validatedBody, req.requestId);
  return sendSuccess(res, result, 201);
});

export const verifyEmailController = asyncHandler(async (req, res) => {
  const result = await verifyStudentEmail(req.validatedBody, req.requestId);
  return sendSuccess(res, result, 200);
});

export const resendVerificationController = asyncHandler(async (req, res) => {
  const result = await resendVerificationCode(req.validatedBody);
  return sendSuccess(res, result, 200);
});

export const loginController = asyncHandler(async (req, res) => {
  const result = await loginUser(req.validatedBody, req.headers['user-agent']);
  setAuthCookies(res, result.rawRefreshToken, result.csrfToken, result.refreshExpiresAt);
  return sendSuccess(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
      csrfToken: result.csrfToken,
    },
    200
  );
});

export const refreshController = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.[env.refreshCookieName];
  const result = await refreshUserSession(rawRefreshToken, req.headers['user-agent']);
  setAuthCookies(res, result.rawRefreshToken, result.csrfToken, result.refreshExpiresAt);
  return sendSuccess(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
      csrfToken: result.csrfToken,
    },
    200
  );
});

export const logoutController = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.[env.refreshCookieName];
  await logoutUserSession(rawRefreshToken);
  clearAuthCookies(res);
  return sendSuccess(res, { loggedOut: true }, 200);
});

export const meController = asyncHandler(async (req, res) => {
  const user = await getCurrentUserProfile(req.user._id);
  return sendSuccess(res, { user }, 200);
});

export const forgotPasswordController = asyncHandler(async (req, res) => {
  const result = await requestPasswordReset(req.validatedBody);
  return sendSuccess(res, result, 200);
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  const result = await resetUserPassword(req.validatedBody, req.requestId);
  clearAuthCookies(res);
  return sendSuccess(res, result, 200);
});

export const devMailPreviewController = asyncHandler(async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Email query parameter is required.');
  }
  const preview = getDevMailForRecipient(email);
  return sendSuccess(res, { preview }, 200);
});

export const mailDiagnosticController = asyncHandler(async (req, res) => {
  const { isSmtpConfigured, getMailTransporter } = await import('../../config/mail.js');
  const transporter = getMailTransporter();

  const diagnostic = {
    smtpConfigured: isSmtpConfigured(),
    resendConfigured: Boolean(env.resendApiKey),
    brevoConfigured: Boolean(env.brevoApiKey),
    smtpHost: env.smtpHost || null,
    smtpPort: env.smtpPort,
    smtpUser: env.smtpUser
      ? `${env.smtpUser.slice(0, 3)}***@${env.smtpUser.split('@')[1] || ''}`
      : null,
    hasPassword: Boolean(env.smtpPass),
    passwordLength: env.smtpPass ? env.smtpPass.length : 0,
    emailFrom: env.emailFrom,
    renderFirewallNotice:
      'Render Free tier blocks outbound TCP connections on ports 25, 465, and 587. If connection times out with ETIMEDOUT, Render firewall dropped the connection.',
  };

  if (env.resendApiKey) {
    return sendSuccess(res, {
      ...diagnostic,
      status: 'RESEND_ACTIVE',
      message: 'Resend API is configured over HTTPS Port 443 (supported by Render Free tier).',
    });
  }

  if (env.brevoApiKey) {
    return sendSuccess(res, {
      ...diagnostic,
      status: 'BREVO_ACTIVE',
      message: 'Brevo API is configured over HTTPS Port 443 (supported by Render Free tier).',
    });
  }

  if (!transporter) {
    return sendSuccess(res, {
      ...diagnostic,
      status: 'NOT_CONFIGURED',
      message: 'Neither SMTP nor HTTPS API credentials were provided.',
    });
  }

  try {
    await Promise.race([
      transporter.verify(),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Connection timed out after 5000ms. Outbound SMTP connection blocked by Render Free tier firewall.'
              )
            ),
          5000
        )
      ),
    ]);
    return sendSuccess(res, {
      ...diagnostic,
      status: 'SMTP_CONNECTED',
      message: 'Successfully connected and authenticated with SMTP server!',
    });
  } catch (err) {
    return sendSuccess(res, {
      ...diagnostic,
      status: 'CONNECTION_FAILED',
      errorMessage: err.message,
      errorCode: err.code || null,
      recommendation:
        err.message.includes('timed out') || err.code === 'ETIMEDOUT'
          ? 'Render Free tier blocks outbound SMTP ports 465/587. Configure RESEND_API_KEY or BREVO_API_KEY (HTTPS port 443) or upgrade Render plan.'
          : 'Check if Google App Password is correct and 2-Step Verification is active.',
    });
  }
});
