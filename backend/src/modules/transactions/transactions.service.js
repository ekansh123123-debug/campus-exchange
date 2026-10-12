import mongoose from 'mongoose';
import { env } from '../../config/env.js';
import { withTransaction } from '../../config/database.js';
import {
  LISTING_STATUS,
  LISTING_TYPE,
} from '../../constants/listing-status.js';
import {
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from '../../constants/transaction-status.js';
import { ROLES } from '../../constants/roles.js';
import { Listing } from '../../models/Listing.model.js';
import { Transaction } from '../../models/Transaction.model.js';
import { User } from '../../models/User.model.js';
import { Review } from '../../models/Review.model.js';
import {
  generateUniquePublicCode,
  PUBLIC_ID_PREFIXES,
} from '../../services/public-id.service.js';
import { createNotification } from '../../services/notification.service.js';
import { recordAuditEvent } from '../../services/audit.service.js';
import { AppError } from '../../utils/app-error.js';
import { parsePagination } from '../../utils/pagination.js';
import { toSafePublicUser } from '../../utils/safe-user.js';

function summarizeListing(listingDoc) {
  if (!listingDoc) return null;
  const l = typeof listingDoc.toObject === 'function' ? listingDoc.toObject() : listingDoc;
  return {
    listingCode: l.listingCode,
    title: l.title,
    listingType: l.listingType,
    pricePaise: l.pricePaise,
    priceInr: Number((l.pricePaise / 100).toFixed(2)),
    condition: l.condition,
    status: l.status,
    thumbnailUrl: l.images?.[0]?.thumbnailUrl || l.images?.[0]?.url || '',
  };
}

export function toTransactionDto(txnDoc, actorId = null, myReview = null) {
  const t = typeof txnDoc.toObject === 'function' ? txnDoc.toObject() : txnDoc;
  const actorIdStr = actorId ? String(actorId) : '';
  const buyerIdStr = String(t.buyerId?._id || t.buyerId);
  const sellerIdStr = String(t.sellerId?._id || t.sellerId);

  return {
    transactionCode: t.transactionCode,
    txnType: t.txnType,
    status: t.status,
    viewerRole:
      actorIdStr === buyerIdStr
        ? 'buyer'
        : actorIdStr === sellerIdStr
        ? 'seller'
        : 'observer',
    listing:
      t.listingId && typeof t.listingId === 'object' && t.listingId.listingCode
        ? summarizeListing(t.listingId)
        : null,
    offeredListing:
      t.offeredListingId && typeof t.offeredListingId === 'object' && t.offeredListingId.listingCode
        ? summarizeListing(t.offeredListingId)
        : null,
    buyer:
      t.buyerId && typeof t.buyerId === 'object' && t.buyerId.userCode
        ? toSafePublicUser(t.buyerId)
        : null,
    seller:
      t.sellerId && typeof t.sellerId === 'object' && t.sellerId.userCode
        ? toSafePublicUser(t.sellerId)
        : null,
    notes: t.notes || '',
    cancellationReason: t.cancellationReason || '',
    reservationExpiresAt: t.reservationExpiresAt
      ? new Date(t.reservationExpiresAt).toISOString()
      : null,
    acceptedAt: t.acceptedAt ? new Date(t.acceptedAt).toISOString() : null,
    cancelledAt: t.cancelledAt ? new Date(t.cancelledAt).toISOString() : null,
    completedAt: t.completedAt ? new Date(t.completedAt).toISOString() : null,
    handoverConfirmedAt: t.handoverConfirmedAt
      ? new Date(t.handoverConfirmedAt).toISOString()
      : null,
    canReview: t.status === TRANSACTION_STATUS.COMPLETED && !myReview,
    myReview: myReview
      ? {
          rating: myReview.rating,
          comment: myReview.comment,
          createdAt: myReview.createdAt,
        }
      : null,
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : null,
    updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : null,
  };
}

export async function reserveSaleListing({
  actor,
  listingCode,
  notes = '',
  requestId = '',
}) {
  const listingCheck = await Listing.findOne({ listingCode });
  if (!listingCheck) {
    throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  }

  if (String(listingCheck.sellerId) === String(actor._id)) {
    throw new AppError(
      400,
      'SELF_TRANSACTION_FORBIDDEN',
      'You cannot reserve or transact on your own listing.'
    );
  }

  if (listingCheck.listingType !== LISTING_TYPE.SELL) {
    throw new AppError(
      400,
      'INVALID_LISTING_TYPE',
      'This listing is for exchange only. Please submit an exchange request instead.'
    );
  }

  if (listingCheck.status !== LISTING_STATUS.ACTIVE) {
    throw new AppError(
      409,
      'ITEM_UNAVAILABLE',
      'This listing is no longer active or has already been reserved.'
    );
  }

  const transactionCode = await generateUniquePublicCode(
    Transaction,
    'transactionCode',
    PUBLIC_ID_PREFIXES.TRANSACTION
  );
  const txnObjectId = new mongoose.Types.ObjectId();
  const reservationExpiresAt = new Date(
    Date.now() + env.reservationExpiryHours * 60 * 60 * 1000
  );

  let createdTxn;
  await withTransaction(async (session) => {
    const lockedListing = await Listing.findOneAndUpdate(
      {
        _id: listingCheck._id,
        status: LISTING_STATUS.ACTIVE,
        listingType: LISTING_TYPE.SELL,
      },
      {
        $set: {
          status: LISTING_STATUS.RESERVED,
          reservedTransactionId: txnObjectId,
        },
      },
      { returnDocument: 'after', ...(session ? { session } : {}) }
    );

    if (!lockedListing) {
      throw new AppError(
        409,
        'ITEM_UNAVAILABLE',
        'This listing was just reserved by another student.'
      );
    }

    const docs = await Transaction.create(
      [
        {
          _id: txnObjectId,
          transactionCode,
          listingId: lockedListing._id,
          buyerId: actor._id,
          sellerId: lockedListing.sellerId,
          txnType: TRANSACTION_TYPE.SALE,
          offeredListingId: null,
          status: TRANSACTION_STATUS.RESERVED,
          reservationExpiresAt,
          notes: String(notes || '').trim(),
        },
      ],
      session ? { session } : {}
    );
    createdTxn = docs[0];
  });

  await createdTxn.populate(['listingId', 'buyerId', 'sellerId']);

  await createNotification({
    userId: listingCheck.sellerId,
    eventType: 'listing_reserved',
    title: 'Your Listing Was Reserved',
    body: `${actor.fullName} reserved "${listingCheck.title}" (${transactionCode}). Coordinate a campus handover in chat.`,
    linkPath: `/transactions`,
  });

  await createNotification({
    userId: actor._id,
    eventType: 'reservation_confirmed',
    title: 'Reservation Confirmed',
    body: `You reserved "${listingCheck.title}" (${transactionCode}). Meet on campus before ${reservationExpiresAt.toLocaleDateString()}.`,
    linkPath: `/transactions`,
  });

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'transaction.reserved',
    targetType: 'transaction',
    targetId: transactionCode,
    metadata: { listingCode: listingCheck.listingCode },
    requestId,
  });

  return toTransactionDto(createdTxn, actor._id);
}

export async function createExchangeRequest({
  actor,
  listingCode,
  offeredListingCode,
  notes = '',
  requestId = '',
}) {
  const requestedListing = await Listing.findOne({ listingCode });
  if (!requestedListing) {
    throw new AppError(404, 'LISTING_NOT_FOUND', 'Requested listing not found.');
  }

  if (String(requestedListing.sellerId) === String(actor._id)) {
    throw new AppError(
      400,
      'SELF_TRANSACTION_FORBIDDEN',
      'You cannot submit an exchange request for your own listing.'
    );
  }

  if (requestedListing.listingType !== LISTING_TYPE.EXCHANGE) {
    throw new AppError(
      400,
      'INVALID_LISTING_TYPE',
      'This listing is a sale listing. Use the reserve endpoint instead.'
    );
  }

  if (requestedListing.status !== LISTING_STATUS.ACTIVE) {
    throw new AppError(
      409,
      'ITEM_UNAVAILABLE',
      'This listing is not active for exchange requests.'
    );
  }

  let offeredListing = null;
  if (offeredListingCode) {
    offeredListing = await Listing.findOne({ listingCode: offeredListingCode });
    if (!offeredListing) {
      throw new AppError(404, 'OFFERED_LISTING_NOT_FOUND', 'Offered listing was not found.');
    }
    if (String(offeredListing._id) === String(requestedListing._id)) {
      throw new AppError(
        400,
        'SAME_LISTING_EXCHANGE',
        'Offered listing cannot be the same as the requested listing.'
      );
    }
    if (String(offeredListing.sellerId) !== String(actor._id)) {
      throw new AppError(
        403,
        'OFFERED_LISTING_NOT_OWNED',
        'You can only offer an active listing that belongs to you.'
      );
    }
    if (offeredListing.status !== LISTING_STATUS.ACTIVE) {
      throw new AppError(
        409,
        'OFFERED_ITEM_UNAVAILABLE',
        'Your offered listing must be active and unlocked.'
      );
    }
  }

  const transactionCode = await generateUniquePublicCode(
    Transaction,
    'transactionCode',
    PUBLIC_ID_PREFIXES.TRANSACTION
  );

  const txn = await Transaction.create({
    transactionCode,
    listingId: requestedListing._id,
    buyerId: actor._id,
    sellerId: requestedListing.sellerId,
    txnType: TRANSACTION_TYPE.EXCHANGE,
    offeredListingId: offeredListing ? offeredListing._id : null,
    status: TRANSACTION_STATUS.PENDING_EXCHANGE,
    notes: String(notes || '').trim(),
  });

  await txn.populate(['listingId', 'offeredListingId', 'buyerId', 'sellerId']);

  await createNotification({
    userId: requestedListing.sellerId,
    eventType: 'exchange_requested',
    title: 'New Exchange Request',
    body: `${actor.fullName} requested an exchange for "${requestedListing.title}" (${transactionCode}).`,
    linkPath: `/transactions`,
  });

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'transaction.exchange_requested',
    targetType: 'transaction',
    targetId: transactionCode,
    metadata: {
      listingCode: requestedListing.listingCode,
      offeredListingCode: offeredListing?.listingCode || null,
    },
    requestId,
  });

  return toTransactionDto(txn, actor._id);
}

export async function acceptExchangeRequest({
  actor,
  transactionCode,
  requestId = '',
}) {
  const txn = await Transaction.findOne({ transactionCode });
  if (!txn) {
    throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found.');
  }

  if (String(txn.sellerId) !== String(actor._id)) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'Only the seller of the requested listing can accept this exchange request.'
    );
  }

  if (
    txn.txnType !== TRANSACTION_TYPE.EXCHANGE ||
    txn.status !== TRANSACTION_STATUS.PENDING_EXCHANGE
  ) {
    throw new AppError(
      409,
      'INVALID_TRANSACTION_STATE',
      'Only pending exchange requests can be accepted.'
    );
  }

  const reservationExpiresAt = new Date(
    Date.now() + env.reservationExpiryHours * 60 * 60 * 1000
  );

  await withTransaction(async (session) => {
    const lockedRequested = await Listing.findOneAndUpdate(
      {
        _id: txn.listingId,
        status: LISTING_STATUS.ACTIVE,
        sellerId: txn.sellerId,
      },
      {
        $set: {
          status: LISTING_STATUS.RESERVED,
          reservedTransactionId: txn._id,
        },
      },
      { returnDocument: 'after', ...(session ? { session } : {}) }
    );

    if (!lockedRequested) {
      throw new AppError(
        409,
        'ITEM_UNAVAILABLE',
        'Requested listing is no longer active and cannot be locked for exchange.'
      );
    }

    if (txn.offeredListingId) {
      const lockedOffered = await Listing.findOneAndUpdate(
        {
          _id: txn.offeredListingId,
          status: LISTING_STATUS.ACTIVE,
          sellerId: txn.buyerId,
        },
        {
          $set: {
            status: LISTING_STATUS.RESERVED,
            reservedTransactionId: txn._id,
          },
        },
        { returnDocument: 'after', ...(session ? { session } : {}) }
      );

      if (!lockedOffered) {
        if (!session) {
          await Listing.updateOne(
            { _id: txn.listingId, reservedTransactionId: txn._id },
            { $set: { status: LISTING_STATUS.ACTIVE, reservedTransactionId: null } }
          );
        }
        throw new AppError(
          409,
          'OFFERED_ITEM_UNAVAILABLE',
          'The offered listing is no longer active and cannot be locked for exchange.'
        );
      }
    }

    const updatedTxn = await Transaction.findOneAndUpdate(
      {
        _id: txn._id,
        status: TRANSACTION_STATUS.PENDING_EXCHANGE,
      },
      {
        $set: {
          status: TRANSACTION_STATUS.ACCEPTED,
          acceptedAt: new Date(),
          reservationExpiresAt,
        },
      },
      { returnDocument: 'after', ...(session ? { session } : {}) }
    );

    if (!updatedTxn) {
      throw new AppError(
        409,
        'INVALID_TRANSACTION_STATE',
        'Exchange request state changed concurrently.'
      );
    }
  });

  const populated = await Transaction.findById(txn._id).populate([
    'listingId',
    'offeredListingId',
    'buyerId',
    'sellerId',
  ]);

  await createNotification({
    userId: txn.buyerId,
    eventType: 'exchange_accepted',
    title: 'Exchange Request Accepted',
    body: `${actor.fullName} accepted your exchange request (${transactionCode}). Coordinate your campus meet-up!`,
    linkPath: `/transactions`,
  });

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'transaction.exchange_accepted',
    targetType: 'transaction',
    targetId: transactionCode,
    requestId,
  });

  return toTransactionDto(populated, actor._id);
}

export async function declineExchangeRequest({
  actor,
  transactionCode,
  reason = '',
  requestId = '',
}) {
  const txn = await Transaction.findOne({ transactionCode });
  if (!txn) {
    throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found.');
  }

  if (String(txn.sellerId) !== String(actor._id)) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'Only the seller can decline this exchange request.'
    );
  }

  if (
    txn.txnType !== TRANSACTION_TYPE.EXCHANGE ||
    txn.status !== TRANSACTION_STATUS.PENDING_EXCHANGE
  ) {
    throw new AppError(
      409,
      'INVALID_TRANSACTION_STATE',
      'Only pending exchange requests can be declined.'
    );
  }

  txn.status = TRANSACTION_STATUS.DECLINED;
  txn.cancellationReason = String(reason || '').trim();
  txn.cancelledAt = new Date();
  txn.cancelledBy = actor._id;
  await txn.save();

  await txn.populate(['listingId', 'offeredListingId', 'buyerId', 'sellerId']);

  await createNotification({
    userId: txn.buyerId._id || txn.buyerId,
    eventType: 'exchange_declined',
    title: 'Exchange Request Declined',
    body: `Your exchange request (${transactionCode}) was declined by the seller.`,
    linkPath: `/transactions`,
  });

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'transaction.exchange_declined',
    targetType: 'transaction',
    targetId: transactionCode,
    requestId,
  });

  return toTransactionDto(txn, actor._id);
}

export async function cancelTransaction({
  actor,
  transactionCode,
  reason = '',
  requestId = '',
}) {
  const txn = await Transaction.findOne({ transactionCode });
  if (!txn) {
    throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found.');
  }

  const actorIdStr = String(actor._id);
  const isParticipant =
    String(txn.buyerId) === actorIdStr || String(txn.sellerId) === actorIdStr;

  if (!isParticipant && actor.role !== ROLES.ADMIN) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'Only transaction participants may cancel this transaction.'
    );
  }

  const cancellableStates = [
    TRANSACTION_STATUS.RESERVED,
    TRANSACTION_STATUS.PENDING_EXCHANGE,
    TRANSACTION_STATUS.ACCEPTED,
  ];

  if (!cancellableStates.includes(txn.status)) {
    throw new AppError(
      409,
      'INVALID_TRANSACTION_STATE',
      `Transaction in "${txn.status}" state cannot be cancelled.`
    );
  }

  await withTransaction(async (session) => {
    const updatedTxn = await Transaction.findOneAndUpdate(
      {
        _id: txn._id,
        status: { $in: cancellableStates },
      },
      {
        $set: {
          status: TRANSACTION_STATUS.CANCELLED,
          cancelledAt: new Date(),
          cancelledBy: actor._id,
          cancellationReason: String(reason || '').trim(),
        },
      },
      { returnDocument: 'after', ...(session ? { session } : {}) }
    );

    if (!updatedTxn) {
      throw new AppError(
        409,
        'INVALID_TRANSACTION_STATE',
        'Transaction state changed concurrently and could not be cancelled.'
      );
    }

    await Listing.updateOne(
      {
        _id: txn.listingId,
        status: LISTING_STATUS.RESERVED,
        reservedTransactionId: txn._id,
      },
      {
        $set: {
          status: LISTING_STATUS.ACTIVE,
          reservedTransactionId: null,
        },
      },
      session ? { session } : {}
    );

    if (txn.offeredListingId) {
      await Listing.updateOne(
        {
          _id: txn.offeredListingId,
          status: LISTING_STATUS.RESERVED,
          reservedTransactionId: txn._id,
        },
        {
          $set: {
            status: LISTING_STATUS.ACTIVE,
            reservedTransactionId: null,
          },
        },
        session ? { session } : {}
      );
    }
  });

  const populated = await Transaction.findById(txn._id).populate([
    'listingId',
    'offeredListingId',
    'buyerId',
    'sellerId',
  ]);

  const otherPartyId =
    String(txn.buyerId) === actorIdStr ? txn.sellerId : txn.buyerId;

  await createNotification({
    userId: otherPartyId,
    eventType: 'transaction_cancelled',
    title: 'Transaction Cancelled',
    body: `Transaction ${transactionCode} has been cancelled and any reserved item is active again.`,
    linkPath: `/transactions`,
  });

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'transaction.cancelled',
    targetType: 'transaction',
    targetId: transactionCode,
    metadata: { reason: String(reason || '').slice(0, 200) },
    requestId,
  });

  return toTransactionDto(populated, actor._id);
}

export async function confirmTransactionHandover({
  actor,
  transactionCode,
  requestId = '',
}) {
  const txn = await Transaction.findOne({ transactionCode });
  if (!txn) {
    throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found.');
  }

  if (String(txn.sellerId) !== String(actor._id)) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'Only the seller can confirm that the campus handover took place.'
    );
  }

  const allowedStates =
    txn.txnType === TRANSACTION_TYPE.SALE
      ? [TRANSACTION_STATUS.RESERVED]
      : [TRANSACTION_STATUS.ACCEPTED];

  if (!allowedStates.includes(txn.status)) {
    throw new AppError(
      409,
      'INVALID_TRANSACTION_STATE',
      'Handover can only be confirmed for an active reservation or accepted exchange.'
    );
  }

  const now = new Date();
  await withTransaction(async (session) => {
    const updatedTxn = await Transaction.findOneAndUpdate(
      {
        _id: txn._id,
        status: { $in: allowedStates },
      },
      {
        $set: {
          status: TRANSACTION_STATUS.COMPLETED,
          completedAt: now,
          handoverConfirmedAt: now,
        },
      },
      { returnDocument: 'after', ...(session ? { session } : {}) }
    );

    if (!updatedTxn) {
      throw new AppError(
        409,
        'INVALID_TRANSACTION_STATE',
        'Transaction state changed concurrently.'
      );
    }

    const updatedMainListing = await Listing.findOneAndUpdate(
      {
        _id: txn.listingId,
        status: LISTING_STATUS.RESERVED,
        reservedTransactionId: txn._id,
      },
      {
        $set: {
          status: LISTING_STATUS.SOLD,
        },
      },
      { returnDocument: 'after', ...(session ? { session } : {}) }
    );

    if (!updatedMainListing) {
      throw new AppError(
        409,
        'LISTING_STATE_MISMATCH',
        'Listing is no longer reserved by this transaction.'
      );
    }

    if (txn.offeredListingId) {
      await Listing.findOneAndUpdate(
        {
          _id: txn.offeredListingId,
          status: LISTING_STATUS.RESERVED,
          reservedTransactionId: txn._id,
        },
        {
          $set: {
            status: LISTING_STATUS.SOLD,
          },
        },
        { returnDocument: 'after', ...(session ? { session } : {}) }
      );
    }

    await User.updateMany(
      { _id: { $in: [txn.buyerId, txn.sellerId] } },
      { $inc: { completedTransactionsCount: 1 } },
      session ? { session } : {}
    );
  });

  const populated = await Transaction.findById(txn._id).populate([
    'listingId',
    'offeredListingId',
    'buyerId',
    'sellerId',
  ]);

  await createNotification({
    userId: txn.buyerId,
    eventType: 'handover_completed',
    title: 'Campus Handover Completed — Leave a Rating',
    body: `Seller confirmed handover for ${transactionCode}. You can now rate your experience!`,
    linkPath: `/transactions`,
  });

  await createNotification({
    userId: txn.sellerId,
    eventType: 'handover_completed',
    title: 'Handover Confirmed — Leave a Rating',
    body: `Handover for ${transactionCode} is complete. You can now rate the buyer.`,
    linkPath: `/transactions`,
  });

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'transaction.completed',
    targetType: 'transaction',
    targetId: transactionCode,
    metadata: { txnType: txn.txnType },
    requestId,
  });

  return toTransactionDto(populated, actor._id);
}

export async function listMyTransactions(actor, query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.role === 'buyer') {
    filter.buyerId = actor._id;
  } else if (query.role === 'seller') {
    filter.sellerId = actor._id;
  } else {
    filter.$or = [{ buyerId: actor._id }, { sellerId: actor._id }];
  }

  if (query.status) {
    filter.status = query.status;
  }
  if (query.txnType) {
    filter.txnType = query.txnType;
  }

  const [rows, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate(['listingId', 'offeredListingId', 'buyerId', 'sellerId']),
    Transaction.countDocuments(filter),
  ]);

  const txnIds = rows.map((r) => r._id);
  const myReviews = await Review.find({
    transactionId: { $in: txnIds },
    authorId: actor._id,
  });
  const reviewMap = new Map(myReviews.map((rev) => [String(rev.transactionId), rev]));

  return {
    items: rows.map((row) =>
      toTransactionDto(row, actor._id, reviewMap.get(String(row._id)) || null)
    ),
    meta: { page, limit, total },
  };
}

export async function getTransactionDetail(actor, transactionCode) {
  const txn = await Transaction.findOne({ transactionCode }).populate([
    'listingId',
    'offeredListingId',
    'buyerId',
    'sellerId',
  ]);

  if (!txn) {
    throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found.');
  }

  const actorIdStr = String(actor._id);
  const isParticipant =
    String(txn.buyerId?._id || txn.buyerId) === actorIdStr ||
    String(txn.sellerId?._id || txn.sellerId) === actorIdStr;

  if (!isParticipant && actor.role !== ROLES.ADMIN) {
    throw new AppError(
      404,
      'TRANSACTION_NOT_FOUND',
      'Transaction not found.'
    );
  }

  const myReview = await Review.findOne({
    transactionId: txn._id,
    authorId: actor._id,
  });

  return toTransactionDto(txn, actor._id, myReview);
}
