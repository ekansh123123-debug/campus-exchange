import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireVerifiedStudent } from '../../middleware/require-verified-student.js';
import { chatMessageRateLimiter } from '../../middleware/rate-limits.js';
import { validateRequest } from '../../middleware/validate-request.js';
import {
  getConversationController,
  listConversationsController,
  listMessagesController,
  markConversationReadController,
  openConversationController,
  sendMessageController,
} from './conversations.controller.js';
import {
  conversationCodeParamSchema,
  openConversationBodySchema,
  sendMessageBodySchema,
} from './conversations.validation.js';

const router = Router();

router.use(authenticate, requireVerifiedStudent);

router.get('/', listConversationsController);

router.post(
  '/',
  chatMessageRateLimiter,
  validateRequest({ body: openConversationBodySchema }),
  openConversationController
);

router.get(
  '/:conversationCode',
  validateRequest({ params: conversationCodeParamSchema }),
  getConversationController
);

router.get(
  '/:conversationCode/messages',
  validateRequest({ params: conversationCodeParamSchema }),
  listMessagesController
);

router.post(
  '/:conversationCode/messages',
  chatMessageRateLimiter,
  validateRequest({
    params: conversationCodeParamSchema,
    body: sendMessageBodySchema,
  }),
  sendMessageController
);

router.patch(
  '/:conversationCode/read',
  validateRequest({ params: conversationCodeParamSchema }),
  markConversationReadController
);

export default router;
