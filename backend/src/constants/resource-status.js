export const RESOURCE_STATUS = Object.freeze({
  PENDING: 'pending',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  REMOVED: 'removed',
});

export const RESOURCE_STATUS_VALUES = Object.freeze(Object.values(RESOURCE_STATUS));

export const RESOURCE_TYPE = Object.freeze({
  PYQ: 'pyq',
  NOTES: 'notes',
  LAB_MANUAL: 'lab_manual',
  SYLLABUS: 'syllabus',
  REFERENCE: 'reference',
});

export const RESOURCE_TYPE_VALUES = Object.freeze(Object.values(RESOURCE_TYPE));
