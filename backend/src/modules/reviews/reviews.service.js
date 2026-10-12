import { Review } from '../../models/Review.model.js';
import { Transaction } from '../../models/Transaction.model.js';
import { User } from '../../models/User.model.js';
import { TRANSACTION_STATUS } from '../../constants/transaction-status.js';
import { createNotification } from '../../services/notification.service.js';
import { recordAuditEvent } from '../../services/audit.service.js';
import { AppError } from '../../utils/app-error.js';
import { parsePagination } from '../../utils/pagination.js';
import { toSafePublicUser } from '../../utils/safe-user.js';

export function toReviewDto(reviewDoc) {
  const r = typeof reviewDoc.toObject === 'function' ? reviewDoc.toObject() : reviewDoc;
  return {
    id: String(r._id || r.id),
    rating: r.rating,
    comment: r.comment || '',
    author: r.authorId && typeof r.authorId === 'object' && r.authorId.userCode
      ? toSafePublicUser(r.authorId)
      : undefined,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
  };
}

export async function recomputeUserRating(targetUserId) {
  const stats = await Review.aggregate([
    { $match: { targetUserId, moderationStatus: 'visible' } },
    {
      $group: {
        _id: '$targetUserId',
        avg: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const ratingAverage = stats[0] ? Math.round(stats[0].avg * 10) / 10 : 0;
  const ratingCount = stats[0] ? stats[0].count : 0;

  await User.findByIdAndUpdate(targetUserId, {
    $set: {
      ratingAverage,
      ratingCount,
    },
  });

  return { ratingAverage, ratingCount };
}

export async function createTransactionReview({
  actor,
  transactionCode,
  rating,
  comment,
  requestId = '',
}) {
  const transaction = await Transaction.findOne({ transactionCode });
  if (!transaction) {
    throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found.');
  }

  const actorIdStr = String(actor._id);
  const isBuyer = String(transaction.buyerId) === actorIdStr;
  const isSeller = String(transaction.sellerId) === actorIdStr;

  if (!isBuyer && !isSeller) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'Only participants of this transaction may submit a review.'
    );
  }

  if (transaction.status !== TRANSACTION_STATUS.COMPLETED) {
    throw new AppError(
      409,
      'TRANSACTION_NOT_COMPLETED',
      'Reviews can only be submitted after the campus handover is completed.'
    );
  }

  const targetUserId = isBuyer ? transaction.sellerId : transaction.buyerId;
  if (String(targetUserId) === actorIdStr) {
    throw new AppError(400, 'SELF_REVIEW_FORBIDDEN', 'You cannot submit a review for yourself.');
  }

  const existing = await Review.findOne({
    transactionId: transaction._id,
    authorId: actor._id,
  });

  if (existing) {
    throw new AppError(
      409,
      'DUPLICATE_REVIEW',
      'You have already submitted a review for this transaction.'
    );
  }

  let reviewDoc;
  try {
    reviewDoc = await Review.create({
      transactionId: transaction._id,
      authorId: actor._id,
      targetUserId,
      rating,
      comment: String(comment || '').trim(),
      moderationStatus: 'visible',
    });
  } catch (err) {
    if (err && err.code === 11000) {
      throw new AppError(
        409,
        'DUPLICATE_REVIEW',
        'You have already submitted a review for this transaction.'
      );
    }
    throw err;
  }

  const updatedStats = await recomputeUserRating(targetUserId);
  await reviewDoc.populate('authorId');

  await createNotification({
    userId: targetUserId,
    eventType: 'review_received',
    title: 'New Rating Received',
    body: `${actor.fullName} left you a ${rating}-star rating for transaction ${transaction.transactionCode}.`,
    linkPath: `/profile`,
  });

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'review.created',
    targetType: 'transaction',
    targetId: transaction.transactionCode,
    metadata: { rating },
    requestId,
  });

  return {
    review: toReviewDto(reviewDoc),
    targetRating: updatedStats,
  };
}

export async function listUserReviews(userCode, query = {}) {
  const user = await User.findOne({ userCode });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User profile not found.');
  }

  const { page, limit, skip } = parsePagination(query);
  const filter = { targetUserId: user._id, moderationStatus: 'visible' };

  const [rows, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId'),
    Review.countDocuments(filter),
  ]);

  return {
    items: rows.map(toReviewDto),
    meta: { page, limit, total },
  };
}
