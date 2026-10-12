import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireCsrfProtection } from '../../middleware/csrf.js';
import {
  authRateLimiter,
  verificationRateLimiter,
} from '../../middleware/rate-limits.js';
import { validateRequest } from '../../middleware/validate-request.js';
import {
  devMailPreviewController,
  forgotPasswordController,
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
  resendVerificationController,
  resetPasswordController,
  verifyEmailController,
} from './auth.controller.js';
import {
  forgotPasswordBodySchema,
  loginBodySchema,
  registerBodySchema,
  resendVerificationBodySchema,
  resetPasswordBodySchema,
  verifyEmailBodySchema,
} from './auth.validation.js';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validateRequest({ body: registerBodySchema }),
  registerController
);

router.post(
  '/verify-email',
  verificationRateLimiter,
  validateRequest({ body: verifyEmailBodySchema }),
  verifyEmailController
);

router.post(
  '/resend-verification',
  verificationRateLimiter,
  validateRequest({ body: resendVerificationBodySchema }),
  resendVerificationController
);

router.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginBodySchema }),
  loginController
);

router.post('/refresh', requireCsrfProtection, refreshController);

router.post('/logout', requireCsrfProtection, logoutController);

router.get('/me', authenticate, meController);

router.post(
  '/forgot-password',
  verificationRateLimiter,
  validateRequest({ body: forgotPasswordBodySchema }),
  forgotPasswordController
);

router.post(
  '/reset-password',
  verificationRateLimiter,
  validateRequest({ body: resetPasswordBodySchema }),
  resetPasswordController
);

router.get('/dev-mail-preview', devMailPreviewController);

export default router;
