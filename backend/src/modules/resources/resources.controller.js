import { asyncHandler } from '../../utils/async-handler.js';
import { sendPaginated, sendSuccess } from '../../utils/api-response.js';
import {
  authorizeAndPrepareResourceDownload,
  getResourceByCode,
  listMyResources,
  searchApprovedResources,
  uploadResource,
} from './resources.service.js';

export const searchResourcesController = asyncHandler(async (req, res) => {
  const result = await searchApprovedResources(req.user, req.validatedQuery || req.query);
  return sendPaginated(res, result.items, result.meta, 200);
});

export const listMyResourcesController = asyncHandler(async (req, res) => {
  const result = await listMyResources(req.user, req.query);
  return sendPaginated(res, result.items, result.meta, 200);
});

export const getResourceDetailController = asyncHandler(async (req, res) => {
  const resource = await getResourceByCode(req.user, req.validatedParams.resourceCode);
  return sendSuccess(res, { resource }, 200);
});

export const uploadResourceController = asyncHandler(async (req, res) => {
  const resource = await uploadResource({
    actor: req.user,
    payload: req.validatedBody,
    file: req.file,
    requestId: req.requestId,
  });
  return sendSuccess(res, { resource }, 201);
});

export const downloadResourceController = asyncHandler(async (req, res) => {
  const payload = await authorizeAndPrepareResourceDownload({
    actor: req.user,
    resourceCode: req.validatedParams.resourceCode,
    requestId: req.requestId,
  });

  if (payload.mode === 'signed_url') {
    return sendSuccess(
      res,
      {
        downloadUrl: payload.signedUrl,
        fileName: payload.fileName,
        expiresInSeconds: payload.expiresInSeconds,
      },
      200
    );
  }

  res.setHeader('Content-Type', payload.mimeType || 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${payload.fileName}"`
  );
  return res.status(200).send(payload.buffer);
});
