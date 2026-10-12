import { asyncHandler } from '../../utils/async-handler.js';
import { sendPaginated, sendSuccess } from '../../utils/api-response.js';
import { createReport, listMyReports } from './reports.service.js';

export const createReportController = asyncHandler(async (req, res) => {
  const report = await createReport({
    actor: req.user,
    payload: req.validatedBody,
    requestId: req.requestId,
  });
  return sendSuccess(res, { report }, 201);
});

export const listMyReportsController = asyncHandler(async (req, res) => {
  const result = await listMyReports(req.user, req.query);
  return sendPaginated(res, result.items, result.meta, 200);
});
