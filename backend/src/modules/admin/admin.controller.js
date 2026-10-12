import { REPORT_STATUS } from '../../constants/upload-limits.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { sendPaginated, sendSuccess } from '../../utils/api-response.js';
import {
  approvePendingListing,
  approvePendingResource,
  assignReportToAdmin,
  blockUserAccount,
  getAdminDashboardStats,
  listAdminListingsQueue,
  listAdminResourcesQueue,
  listAuditEventsForAdmin,
  listReportsForAdmin,
  listUsersForAdmin,
  rejectPendingListing,
  rejectPendingResource,
  restoreUserAccount,
  takedownResource,
  updateReportResolution,
} from './admin.service.js';

export const adminDashboardController = asyncHandler(async (_req, res) => {
  const stats = await getAdminDashboardStats();
  return sendSuccess(res, { stats }, 200);
});

export const adminListingsQueueController = asyncHandler(async (req, res) => {
  const result = await listAdminListingsQueue(
    req.user,
    req.validatedQuery || req.query
  );
  return sendPaginated(res, result.items, result.meta, 200);
});

export const approveListingController = asyncHandler(async (req, res) => {
  const listing = await approvePendingListing({
    actor: req.user,
    listingCode: req.validatedParams.listingCode,
    requestId: req.requestId,
  });
  return sendSuccess(res, { listing }, 200);
});

export const rejectListingController = asyncHandler(async (req, res) => {
  const listing = await rejectPendingListing({
    actor: req.user,
    listingCode: req.validatedParams.listingCode,
    reason: req.validatedBody.reason,
    requestId: req.requestId,
  });
  return sendSuccess(res, { listing }, 200);
});

export const adminResourcesQueueController = asyncHandler(async (req, res) => {
  const result = await listAdminResourcesQueue(
    req.user,
    req.validatedQuery || req.query
  );
  return sendPaginated(res, result.items, result.meta, 200);
});

export const approveResourceController = asyncHandler(async (req, res) => {
  const resource = await approvePendingResource({
    actor: req.user,
    resourceCode: req.validatedParams.resourceCode,
    requestId: req.requestId,
  });
  return sendSuccess(res, { resource }, 200);
});

export const rejectResourceController = asyncHandler(async (req, res) => {
  const resource = await rejectPendingResource({
    actor: req.user,
    resourceCode: req.validatedParams.resourceCode,
    reason: req.validatedBody.reason,
    requestId: req.requestId,
  });
  return sendSuccess(res, { resource }, 200);
});

export const takedownResourceController = asyncHandler(async (req, res) => {
  const resource = await takedownResource({
    actor: req.user,
    resourceCode: req.validatedParams.resourceCode,
    reason: req.validatedBody.reason,
    requestId: req.requestId,
  });
  return sendSuccess(res, { resource }, 200);
});

export const adminUsersListController = asyncHandler(async (req, res) => {
  const result = await listUsersForAdmin(req.validatedQuery || req.query);
  return sendPaginated(res, result.items, result.meta, 200);
});

export const blockUserController = asyncHandler(async (req, res) => {
  const user = await blockUserAccount({
    actor: req.user,
    userCode: req.validatedParams.userCode,
    reason: req.validatedBody.reason,
    requestId: req.requestId,
  });
  return sendSuccess(res, { user }, 200);
});

export const restoreUserController = asyncHandler(async (req, res) => {
  const user = await restoreUserAccount({
    actor: req.user,
    userCode: req.validatedParams.userCode,
    reason: req.validatedBody.reason,
    requestId: req.requestId,
  });
  return sendSuccess(res, { user }, 200);
});

export const adminReportsQueueController = asyncHandler(async (req, res) => {
  const result = await listReportsForAdmin(req.validatedQuery || req.query);
  return sendPaginated(res, result.items, result.meta, 200);
});

export const assignReportController = asyncHandler(async (req, res) => {
  const report = await assignReportToAdmin({
    actor: req.user,
    reportCode: req.validatedParams.reportCode,
    requestId: req.requestId,
  });
  return sendSuccess(res, { report }, 200);
});

export const resolveReportController = asyncHandler(async (req, res) => {
  const note = req.validatedBody?.note || req.validatedBody?.reason || 'Resolved by admin';
  const report = await updateReportResolution({
    actor: req.user,
    reportCode: req.validatedParams.reportCode,
    nextStatus: REPORT_STATUS.RESOLVED,
    note,
    requestId: req.requestId,
  });
  return sendSuccess(res, { report }, 200);
});

export const dismissReportController = asyncHandler(async (req, res) => {
  const note = req.validatedBody?.note || req.validatedBody?.reason || 'Dismissed by admin';
  const report = await updateReportResolution({
    actor: req.user,
    reportCode: req.validatedParams.reportCode,
    nextStatus: REPORT_STATUS.DISMISSED,
    note,
    requestId: req.requestId,
  });
  return sendSuccess(res, { report }, 200);
});

export const adminAuditEventsController = asyncHandler(async (req, res) => {
  const result = await listAuditEventsForAdmin(req.query);
  return sendPaginated(res, result.items, result.meta, 200);
});
