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
