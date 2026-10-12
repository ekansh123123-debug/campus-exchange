import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireActiveAccount } from '../../middleware/require-active-account.js';
import { validateRequest } from '../../middleware/validate-request.js';
import {
  listNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController,
  unreadNotificationCountController,
} from './notifications.controller.js';
import { notificationCodeParamSchema } from './notifications.validation.js';

const router = Router();

router.use(authenticate, requireActiveAccount);

router.get('/', listNotificationsController);

router.get('/unread-count', unreadNotificationCountController);

router.patch('/read-all', markAllNotificationsReadController);

router.patch(
  '/:notificationCode/read',
  validateRequest({ params: notificationCodeParamSchema }),
  markNotificationReadController
);

export default router;
