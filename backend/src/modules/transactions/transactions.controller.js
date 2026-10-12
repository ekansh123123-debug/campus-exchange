import { asyncHandler } from '../../utils/async-handler.js';
import { sendPaginated, sendSuccess } from '../../utils/api-response.js';
import {
  acceptExchangeRequest,
  cancelTransaction,
  confirmTransactionHandover,
  createExchangeRequest,
  declineExchangeRequest,
  getTransactionDetail,
  listMyTransactions,
  reserveSaleListing,
} from './transactions.service.js';

export const reserveListingController = asyncHandler(async (req, res) => {
  const transaction = await reserveSaleListing({
    actor: req.user,
    listingCode: req.validatedParams.listingCode,
    notes: req.validatedBody?.notes,
    requestId: req.requestId,
  });
  return sendSuccess(res, { transaction }, 201);
});

export const createExchangeRequestController = asyncHandler(async (req, res) => {
  const transaction = await createExchangeRequest({
    actor: req.user,
    listingCode: req.validatedParams.listingCode,
    offeredListingCode: req.validatedBody?.offeredListingCode,
    notes: req.validatedBody?.notes,
    requestId: req.requestId,
  });
  return sendSuccess(res, { transaction }, 201);
});

export const listMyTransactionsController = asyncHandler(async (req, res) => {
  const result = await listMyTransactions(req.user, req.validatedQuery || req.query);
  return sendPaginated(res, result.items, result.meta, 200);
});

export const getTransactionDetailController = asyncHandler(async (req, res) => {
  const transaction = await getTransactionDetail(
    req.user,
    req.validatedParams.transactionCode
  );
  return sendSuccess(res, { transaction }, 200);
});

export const acceptExchangeController = asyncHandler(async (req, res) => {
  const transaction = await acceptExchangeRequest({
    actor: req.user,
    transactionCode: req.validatedParams.transactionCode,
    requestId: req.requestId,
  });
  return sendSuccess(res, { transaction }, 200);
});

export const declineExchangeController = asyncHandler(async (req, res) => {
  const transaction = await declineExchangeRequest({
    actor: req.user,
    transactionCode: req.validatedParams.transactionCode,
    reason: req.validatedBody?.reason,
    requestId: req.requestId,
  });
  return sendSuccess(res, { transaction }, 200);
});

export const cancelTransactionController = asyncHandler(async (req, res) => {
  const transaction = await cancelTransaction({
    actor: req.user,
    transactionCode: req.validatedParams.transactionCode,
    reason: req.validatedBody?.reason,
    requestId: req.requestId,
  });
  return sendSuccess(res, { transaction }, 200);
});

export const confirmHandoverController = asyncHandler(async (req, res) => {
  const transaction = await confirmTransactionHandover({
    actor: req.user,
    transactionCode: req.validatedParams.transactionCode,
    requestId: req.requestId,
  });
  return sendSuccess(res, { transaction }, 200);
});
