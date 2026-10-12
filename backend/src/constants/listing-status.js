export const LISTING_STATUS = Object.freeze({
  DRAFT: 'draft',
  PENDING: 'pending',
  ACTIVE: 'active',
  RESERVED: 'reserved',
  SOLD: 'sold',
  REJECTED: 'rejected',
  REMOVED: 'removed',
});

export const LISTING_STATUS_VALUES = Object.freeze(Object.values(LISTING_STATUS));

export const LISTING_TYPE = Object.freeze({
  SELL: 'sell',
  EXCHANGE: 'exchange',
});

export const LISTING_TYPE_VALUES = Object.freeze(Object.values(LISTING_TYPE));

export const LISTING_CONDITION = Object.freeze({
  NEW: 'new',
  LIKE_NEW: 'like_new',
  GOOD: 'good',
  FAIR: 'fair',
  FOR_PARTS: 'for_parts',
});

export const LISTING_CONDITION_VALUES = Object.freeze(Object.values(LISTING_CONDITION));

export const LISTING_SORT_VALUES = Object.freeze([
  'newest',
  'price_asc',
  'price_desc',
]);
