export const BRANCHES = Object.freeze([
  'CSE',
  'IT',
  'AI_DS',
  'ECE',
  'EEE',
  'ME',
  'CE',
  'CHEM',
  'GENERAL',
]);

export const ACADEMIC_YEARS = Object.freeze(['1', '2', '3', '4']);

export const SEMESTERS = Object.freeze(['1', '2', '3', '4', '5', '6', '7', '8']);

export const INITIAL_CATEGORIES = Object.freeze([
  {
    name: 'Textbooks & Reference Books',
    slug: 'textbooks',
    description: 'Engineering textbooks, competitive exam guides, and reference manuals.',
    sortOrder: 1,
    active: true,
  },
  {
    name: 'Scientific Calculators',
    slug: 'calculators',
    description: 'Non-programmable and engineering calculators approved for university exams.',
    sortOrder: 2,
    active: true,
  },
  {
    name: 'Drawing & Drafting Instruments',
    slug: 'drawing-instruments',
    description: 'Mini drafters, roller scales, sheet holders, compasses, and engineering graphics kits.',
    sortOrder: 3,
    active: true,
  },
  {
    name: 'Lab Kits & Electronics',
    slug: 'lab-kits',
    description: 'Microcontroller boards, breadboards, multimeters, sensors, and workshop aprons/tools.',
    sortOrder: 4,
    active: true,
  },
  {
    name: 'Course Notes & Printed Material',
    slug: 'course-notes',
    description: 'Handwritten binders, lab observation records, and printed lecture compilations.',
    sortOrder: 5,
    active: true,
  },
  {
    name: 'Other Academic Supplies',
    slug: 'academic-supplies',
    description: 'Other college-approved study aids and academic equipment.',
    sortOrder: 6,
    active: true,
  },
]);
