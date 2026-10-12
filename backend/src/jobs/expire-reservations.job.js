import { withTransaction } from '../config/database.js';
import { logger } from '../config/logger.js';
import { LISTING_STATUS } from '../constants/listing-status.js';
import { TRANSACTION_STATUS } from '../constants/transaction-status.js';
import { Listing } from '../models/Listing.model.js';
import { Transaction } from '../models/Transaction.model.js';
import { createNotification } from '../services/notification.service.js';
import { recordAuditEvent } from '../services/audit.service.js';

export async function expireStaleReservations(now = new Date(), batchSize = 50) {
  const candidates = await Transaction.find({
    status: { $in: [TRANSACTION_STATUS.RESERVED, TRANSACTION_STATUS.ACCEPTED] },
    reservationExpiresAt: { $ne: null, $lte: now },
  })
    .sort({ reservationExpiresAt: 1 })
    .limit(batchSize);

  let expiredCount = 0;

  for (const txn of candidates) {
    try {
      let didExpire = false;
      await withTransaction(async (session) => {
        const updatedTxn = await Transaction.findOneAndUpdate(
          {
            _id: txn._id,
            status: { $in: [TRANSACTION_STATUS.RESERVED, TRANSACTION_STATUS.ACCEPTED] },
            reservationExpiresAt: { $lte: now },
          },
          {
            $set: {
              status: TRANSACTION_STATUS.EXPIRED,
              cancelledAt: now,
              cancellationReason: 'Reservation window expired automatically.',
            },
          },
          { returnDocument: 'after', ...(session ? { session } : {}) }
        );

        if (!updatedTxn) return;
        didExpire = true;

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

      if (didExpire) {
        expiredCount += 1;
        await createNotification({
          userId: txn.buyerId,
          eventType: 'reservation_expired',
          title: 'Reservation Expired',
          body: `Reservation ${txn.transactionCode} expired and the listing has been released back to the marketplace.`,
          linkPath: `/transactions`,
        });
        await createNotification({
          userId: txn.sellerId,
          eventType: 'reservation_expired',
          title: 'Reservation Expired — Listing Active Again',
          body: `Reservation ${txn.transactionCode} expired. Your listing is active in the marketplace again.`,
          linkPath: `/my-listings`,
        });
        await recordAuditEvent({
          actorRole: 'system',
          action: 'transaction.expired',
          targetType: 'transaction',
          targetId: txn.transactionCode,
        });
      }
    } catch (err) {
      logger.warn(
        { transactionCode: txn.transactionCode, reason: err.message },
        'Failed to expire stale reservation'
      );
    }
  }

  return { expiredCount };
}

export function startReservationExpiryScheduler(intervalMs = 5 * 60 * 1000) {
  const timer = setInterval(() => {
    expireStaleReservations().catch((err) => {
      logger.warn({ reason: err.message }, 'Reservation expiry scheduler error');
    });
  }, intervalMs);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
  return timer;
}
