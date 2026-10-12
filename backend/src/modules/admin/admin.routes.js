import { Router } from 'express';
import { ROLES } from '../../constants/roles.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireActiveAccount } from '../../middleware/require-active-account.js';
import { requireRole } from '../../middleware/require-role.js';
import { validateRequest } from '../../middleware/validate-request.js';
import {
  adminAuditEventsController,
  adminDashboardController,
  adminListingsQueueController,
  adminReportsQueueController,
  adminResourcesQueueController,
  adminUsersListController,
  approveListingController,
  approveResourceController,
  assignReportController,
  blockUserController,
  dismissReportController,
  rejectListingController,
  rejectResourceController,
  resolveReportController,
  restoreUserController,
  takedownResourceController,
} from './admin.controller.js';
import {
  adminListingsQuerySchema,
  adminReportsQuerySchema,
  adminResourcesQuerySchema,
  adminUsersQuerySchema,
  listingCodeParamSchema,
  moderationReasonBodySchema,
  optionalNoteBodySchema,
  reportCodeParamSchema,
  resourceCodeParamSchema,
  userCodeParamSchema,
} from './admin.validation.js';

const router = Router();

router.use(authenticate, requireActiveAccount, requireRole(ROLES.ADMIN));

router.get('/dashboard', adminDashboardController);

router.get(
  '/listings',
  validateRequest({ query: adminListingsQuerySchema }),
  adminListingsQueueController
);

router.post(
  '/listings/:listingCode/approve',
  validateRequest({ params: listingCodeParamSchema }),
  approveListingController
);

router.post(
  '/listings/:listingCode/reject',
  validateRequest({
    params: listingCodeParamSchema,
    body: moderationReasonBodySchema,
  }),
  rejectListingController
);

router.get(
  '/resources',
  validateRequest({ query: adminResourcesQuerySchema }),
  adminResourcesQueueController
);

router.post(
  '/resources/:resourceCode/approve',
  validateRequest({ params: resourceCodeParamSchema }),
  approveResourceController
);

router.post(
  '/resources/:resourceCode/reject',
  validateRequest({
    params: resourceCodeParamSchema,
    body: moderationReasonBodySchema,
  }),
  rejectResourceController
);

router.post(
  '/resources/:resourceCode/takedown',
  validateRequest({
    params: resourceCodeParamSchema,
    body: moderationReasonBodySchema,
  }),
  takedownResourceController
);

router.get(
  '/users',
  validateRequest({ query: adminUsersQuerySchema }),
  adminUsersListController
);

router.post(
  '/users/:userCode/block',
  validateRequest({
    params: userCodeParamSchema,
    body: moderationReasonBodySchema,
  }),
  blockUserController
);

router.post(
  '/users/:userCode/restore',
  validateRequest({
    params: userCodeParamSchema,
    body: moderationReasonBodySchema,
  }),
  restoreUserController
);

router.get(
  '/reports',
  validateRequest({ query: adminReportsQuerySchema }),
  adminReportsQueueController
);

router.post(
  '/reports/:reportCode/assign',
  validateRequest({ params: reportCodeParamSchema }),
  assignReportController
);

router.post(
  '/reports/:reportCode/resolve',
  validateRequest({
    params: reportCodeParamSchema,
    body: optionalNoteBodySchema,
  }),
  resolveReportController
);

router.post(
  '/reports/:reportCode/dismiss',
  validateRequest({
    params: reportCodeParamSchema,
    body: optionalNoteBodySchema,
  }),
  dismissReportController
);

router.get('/audit-events', adminAuditEventsController);

export default router;
