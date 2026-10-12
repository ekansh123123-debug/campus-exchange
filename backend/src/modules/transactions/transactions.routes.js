import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireVerifiedStudent } from '../../middleware/require-verified-student.js';
import { validateRequest } from '../../middleware/validate-request.js';
import { createReviewController } from '../reviews/reviews.controller.js';
import { createReviewBodySchema } from '../reviews/reviews.validation.js';
import {
  acceptExchangeController,
  cancelTransactionController,
  confirmHandoverController,
  declineExchangeController,
  getTransactionDetailController,
  listMyTransactionsController,
} from './transactions.controller.js';
import {
  listTransactionsQuerySchema,
  transactionActionBodySchema,
  transactionCodeParamSchema,
} from './transactions.validation.js';

const router = Router();

router.use(authenticate, requireVerifiedStudent);

router.get(
  '/',
  validateRequest({ query: listTransactionsQuerySchema }),
  listMyTransactionsController
);

router.get(
  '/:transactionCode',
  validateRequest({ params: transactionCodeParamSchema }),
  getTransactionDetailController
);

router.post(
  '/:transactionCode/accept',
  validateRequest({
    params: transactionCodeParamSchema,
    body: transactionActionBodySchema,
  }),
  acceptExchangeController
);

router.post(
  '/:transactionCode/decline',
  validateRequest({
    params: transactionCodeParamSchema,
    body: transactionActionBodySchema,
  }),
  declineExchangeController
);

router.post(
  '/:transactionCode/cancel',
  validateRequest({
    params: transactionCodeParamSchema,
    body: transactionActionBodySchema,
  }),
  cancelTransactionController
);

router.post(
  '/:transactionCode/confirm-handover',
  validateRequest({
    params: transactionCodeParamSchema,
    body: transactionActionBodySchema,
  }),
  confirmHandoverController
);

router.post(
  '/:transactionCode/reviews',
  validateRequest({
    params: transactionCodeParamSchema,
    body: createReviewBodySchema,
  }),
  createReviewController
);

export default router;
