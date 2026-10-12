import { asyncHandler } from '../../utils/async-handler.js';
import { sendPaginated, sendSuccess } from '../../utils/api-response.js';
import {
  createTransactionReview,
  listUserReviews,
} from './reviews.service.js';

export const createReviewController = asyncHandler(async (req, res) => {
  const result = await createTransactionReview({
    actor: req.user,
    transactionCode: req.validatedParams.transactionCode,
    rating: req.validatedBody.rating,
    comment: req.validatedBody.comment,
    requestId: req.requestId,
  });
  return sendSuccess(res, result, 201);
});

export const listUserReviewsController = asyncHandler(async (req, res) => {
  const result = await listUserReviews(req.validatedParams.userCode, req.query);
  return sendPaginated(res, result.items, result.meta, 200);
});
