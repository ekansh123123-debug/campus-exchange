export const TRANSACTION_STATUS = Object.freeze({
  RESERVED: 'reserved',
  PENDING_EXCHANGE: 'pending_exchange',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  COMPLETED: 'completed',
  DISPUTED: 'disputed',
});

export const TRANSACTION_STATUS_VALUES = Object.freeze(Object.values(TRANSACTION_STATUS));

export const TRANSACTION_TYPE = Object.freeze({
  SALE: 'sale',
  EXCHANGE: 'exchange',
});

export const TRANSACTION_TYPE_VALUES = Object.freeze(Object.values(TRANSACTION_TYPE));
