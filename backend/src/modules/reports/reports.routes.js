import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireVerifiedStudent } from '../../middleware/require-verified-student.js';
import { reportRateLimiter } from '../../middleware/rate-limits.js';
import { validateRequest } from '../../middleware/validate-request.js';
import {
  createReportController,
  listMyReportsController,
} from './reports.controller.js';
import { createReportBodySchema } from './reports.validation.js';

const router = Router();

router.use(authenticate, requireVerifiedStudent);

router.get('/mine', listMyReportsController);

router.post(
  '/',
  reportRateLimiter,
  validateRequest({ body: createReportBodySchema }),
  createReportController
);

export default router;
