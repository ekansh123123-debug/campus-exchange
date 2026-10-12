export const BRANCHES = [
  'CSE',
  'IT',
  'AI_DS',
  'ECE',
  'EEE',
  'ME',
  'CE',
  'CHEM',
  'GENERAL',
];

export const DEPARTMENTS = BRANCHES;

export const ACADEMIC_YEARS = ['1', '2', '3', '4'];

export const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export const LISTING_CONDITIONS = [
  { value: 'new', label: 'New / Unused' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'for_parts', label: 'For Parts / Repair' },
];

export const LISTING_TYPES = [
  { value: 'sell', label: 'Sell / Paid or Free (₹)' },
  { value: 'exchange', label: 'Exchange / Barter' },
];

export const PRICING_MODES = LISTING_TYPES;

export const RESOURCE_TYPES = [
  { value: 'pyq', label: 'Previous Year Question Paper (PYQ)' },
  { value: 'notes', label: 'Lecture Notes' },
  { value: 'lab_manual', label: 'Lab Manual / Practical' },
  { value: 'syllabus', label: 'Course Syllabus' },
  { value: 'reference', label: 'Reference / Formula Sheet' },
];

export const PICKUP_LOCATIONS = [
  'Main Central Library Gate',
  'Academic Block A Foyer',
  'Academic Block B Courtyard',
  'Student Activity Center (SAC)',
  'Main Canteen Veranda',
  'Hostel Plaza Gate 1',
  'Computer Center Entrance',
];

export const REPORT_REASON_CODES = [
  { value: 'Suspected scam or fraudulent listing', label: 'Scam or Fraudulent Activity' },
  { value: 'Prohibited campus item', label: 'Prohibited Campus Item' },
  { value: 'Fake or misleading academic resource', label: 'Fake or Misleading Academic File' },
  { value: 'Copyright or plagiarism violation', label: 'Copyright or Plagiarism Violation' },
  { value: 'Harassment or abusive conduct', label: 'Harassment or Abusive Conduct' },
  { value: 'Inaccurate condition or edition details', label: 'Inaccurate Edition or Condition' },
  { value: 'No-show or dishonest campus handover', label: 'No-Show or Dishonest Handover' },
];
