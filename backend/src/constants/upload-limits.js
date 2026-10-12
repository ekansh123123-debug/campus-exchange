export const ALLOWED_IMAGE_MIMES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const ALLOWED_IMAGE_EXTENSIONS = Object.freeze([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
]);

export const ALLOWED_RESOURCE_MIMES = Object.freeze([
  'application/pdf',
]);

export const ALLOWED_RESOURCE_EXTENSIONS = Object.freeze([
  '.pdf',
]);

export const REPORT_STATUS = Object.freeze({
  OPEN: 'open',
  IN_REVIEW: 'in_review',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
});

export const REPORT_STATUS_VALUES = Object.freeze(Object.values(REPORT_STATUS));

export const REPORT_TARGET_TYPES = Object.freeze({
  LISTING: 'listing',
  USER: 'user',
  RESOURCE: 'resource',
});

export const REPORT_TARGET_TYPE_VALUES = Object.freeze(Object.values(REPORT_TARGET_TYPES));
