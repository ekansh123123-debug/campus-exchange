import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireActiveAccount } from '../../middleware/require-active-account.js';
import { validateRequest } from '../../middleware/validate-request.js';
import { listUserReviewsController } from '../reviews/reviews.controller.js';
import {
  getMyProfileController,
  getPublicProfileController,
  updateMyProfileController,
} from './users.controller.js';
import {
  updateProfileBodySchema,
  userCodeParamSchema,
} from './users.validation.js';

const router = Router();

router.get('/me', authenticate, requireActiveAccount, getMyProfileController);

router.patch(
  '/me',
  authenticate,
  requireActiveAccount,
  validateRequest({ body: updateProfileBodySchema }),
  updateMyProfileController
);

router.get(
  '/:userCode',
  authenticate,
  requireActiveAccount,
  validateRequest({ params: userCodeParamSchema }),
  getPublicProfileController
);

router.get(
  '/:userCode/reviews',
  authenticate,
  requireActiveAccount,
  validateRequest({ params: userCodeParamSchema }),
  listUserReviewsController
);

export default router;
