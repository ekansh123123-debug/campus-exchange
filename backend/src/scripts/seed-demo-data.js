import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { ACCOUNT_STATUS } from '../constants/account-status.js';
import {
  LISTING_CONDITION,
  LISTING_STATUS,
  LISTING_TYPE,
} from '../constants/listing-status.js';
import {
  RESOURCE_STATUS,
  RESOURCE_TYPE,
} from '../constants/resource-status.js';
import { ROLES } from '../constants/roles.js';
import { Category } from '../models/Category.model.js';
import { Listing } from '../models/Listing.model.js';
import { Resource } from '../models/Resource.model.js';
import { User } from '../models/User.model.js';
import { ensureCategoriesSeeded } from '../modules/categories/categories.service.js';
import {
  generateUniquePublicCode,
  PUBLIC_ID_PREFIXES,
} from '../services/public-id.service.js';
import { provisionAdminAccount } from './create-admin.js';

function createSvgDataUri(title, subtitle, accentHex = '#cc785c') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
    <rect width="640" height="420" fill="#f5f0e8"/>
    <rect x="24" y="24" width="592" height="372" rx="16" fill="#faf9f5" stroke="#e6dfd8" stroke-width="2"/>
    <rect x="48" y="48" width="120" height="28" rx="14" fill="${accentHex}"/>
    <text x="108" y="67" font-family="Inter, sans-serif" font-size="12" font-weight="600" fill="#ffffff" text-anchor="middle">DEMO SEED</text>
    <text x="48" y="165" font-family="Georgia, serif" font-size="28" font-weight="700" fill="#141413">${title}</text>
    <text x="48" y="210" font-family="Inter, sans-serif" font-size="16" fill="#6c6a64">${subtitle}</text>
    <text x="48" y="348" font-family="monospace" font-size="13" fill="#8e8b82">CampusExchange Verified Academic Item</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function seedDemoDataIfEmpty() {
  await ensureCategoriesSeeded();
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) {
    return { skipped: true };
  }

  const admin = await provisionAdminAccount({
    fullName: 'Dr. Kavita Rao (Campus Moderator)',
    collegeEmail: 'admin@nitk.edu.in',
    password: 'AdminCampus@2026',
  });

  const studentPassHash = await bcrypt.hash('Student@2026', 10);

  const aaravCode = await generateUniquePublicCode(User, 'userCode', PUBLIC_ID_PREFIXES.USER);
  const aarav = await User.create({
    userCode: aaravCode,
    fullName: 'Aarav Sharma [DEMO]',
    collegeEmail: 'aarav.cs24@nitk.edu.in',
    passwordHash: studentPassHash,
    role: ROLES.STUDENT,
    emailVerifiedAt: new Date(),
    accountStatus: ACCOUNT_STATUS.ACTIVE,
    branch: 'CSE',
    academicYear: '3',
    bio: '[DEMO ACCOUNT] 3rd-year CSE student sharing textbooks, lab kits, and semester PYQs.',
    ratingAverage: 4.8,
    ratingCount: 5,
    completedTransactionsCount: 6,
    isDemoSeed: true,
  });

  const priyaCode = await generateUniquePublicCode(User, 'userCode', PUBLIC_ID_PREFIXES.USER);
  const priya = await User.create({
    userCode: priyaCode,
    fullName: 'Priya Menon [DEMO]',
    collegeEmail: 'priya.ec25@nitk.edu.in',
    passwordHash: studentPassHash,
    role: ROLES.STUDENT,
    emailVerifiedAt: new Date(),
    accountStatus: ACCOUNT_STATUS.ACTIVE,
    branch: 'ECE',
    academicYear: '2',
    bio: '[DEMO ACCOUNT] 2nd-year ECE student looking to exchange calculators and analog electronics kits.',
    ratingAverage: 4.9,
    ratingCount: 4,
    completedTransactionsCount: 4,
    isDemoSeed: true,
  });

  const categories = await Category.find({ active: true });
  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  const sampleListings = [
    {
      sellerId: aarav._id,
      categoryId: catBySlug['textbooks']._id,
      title: '[DEMO] Introduction to Algorithms (CLRS) — 3rd Edition',
      description:
        'Clean hardcover copy of Cormen, Leiserson, Rivest, and Stein (CLRS). No torn pages, includes pencil annotations for CS301 Design & Analysis of Algorithms.',
      listingType: LISTING_TYPE.SELL,
      pricePaise: 45000,
      condition: LISTING_CONDITION.GOOD,
      branch: 'CSE',
      academicYear: '2',
      semester: '4',
      subject: 'Design and Analysis of Algorithms',
      edition: '3rd Edition',
      author: 'Thomas H. Cormen',
      status: LISTING_STATUS.ACTIVE,
      images: [
        {
          provider: 'local',
          fileId: 'demo-img-clrs',
          url: createSvgDataUri('CLRS Algorithms 3e', 'CSE Sem 4 • ₹450'),
          thumbnailUrl: createSvgDataUri('CLRS Algorithms 3e', 'CSE Sem 4 • ₹450'),
          altText: 'Introduction to Algorithms textbook',
        },
      ],
    },
    {
      sellerId: priya._id,
      categoryId: catBySlug['calculators']._id,
      title: '[DEMO] Casio fx-991CW Non-Programmable Scientific Calculator',
      description:
        'Used for two semesters in Engineering Mathematics and Signals & Systems. Solar + battery working perfectly with hard slide cover.',
      listingType: LISTING_TYPE.SELL,
      pricePaise: 75000,
      condition: LISTING_CONDITION.LIKE_NEW,
      branch: 'ECE',
      academicYear: '1',
      semester: '2',
      subject: 'Engineering Mathematics',
      edition: 'fx-991CW',
      author: 'Casio',
      status: LISTING_STATUS.ACTIVE,
      images: [
        {
          provider: 'local',
          fileId: 'demo-img-casio',
          url: createSvgDataUri('Casio fx-991CW', 'Scientific Calculator • ₹750', '#1ba673'),
          thumbnailUrl: createSvgDataUri('Casio fx-991CW', 'Scientific Calculator • ₹750', '#1ba673'),
          altText: 'Casio fx-991CW calculator',
        },
      ],
    },
    {
      sellerId: aarav._id,
      categoryId: catBySlug['drawing-instruments']._id,
      title: '[DEMO] Omega Mini Drafter + Sheet Holder Tube (Exchange)',
      description:
        'Complete first-year Engineering Graphics kit with Omega stainless steel mini drafter, roller scale, and waterproof drawing sheet tube. Open to exchange for an Arduino Uno kit.',
      listingType: LISTING_TYPE.EXCHANGE,
      pricePaise: 0,
      condition: LISTING_CONDITION.GOOD,
      branch: 'ME',
      academicYear: '1',
      semester: '1',
      subject: 'Engineering Graphics',
      exchangePreference: 'Looking for Arduino Uno R3 kit or Digital Logic Design textbook',
      status: LISTING_STATUS.ACTIVE,
      images: [
        {
          provider: 'local',
          fileId: 'demo-img-drafter',
          url: createSvgDataUri('Omega Mini Drafter Kit', '1st Year Graphics • Exchange', '#2563eb'),
          thumbnailUrl: createSvgDataUri('Omega Mini Drafter Kit', '1st Year Graphics • Exchange', '#2563eb'),
          altText: 'Omega Mini Drafter Kit',
        },
      ],
    },
    {
      sellerId: priya._id,
      categoryId: catBySlug['lab-kits']._id,
      title: '[DEMO] Analog & Digital Electronics Breadboard Component Kit',
      description:
        'Includes 2 solderless breadboards, 74xx logic IC set, op-amp ICs (LM741), jumper wires, resistors, and digital multimeter leads for ECE 3rd semester labs.',
      listingType: LISTING_TYPE.SELL,
      pricePaise: 60000,
      condition: LISTING_CONDITION.LIKE_NEW,
      branch: 'ECE',
      academicYear: '2',
      semester: '3',
      subject: 'Digital System Design Lab',
      status: LISTING_STATUS.PENDING,
      images: [
        {
          provider: 'local',
          fileId: 'demo-img-labkit',
          url: createSvgDataUri('ECE Breadboard Lab Kit', 'Pending Moderation • ₹600', '#b45309'),
          thumbnailUrl: createSvgDataUri('ECE Breadboard Lab Kit', 'Pending Moderation • ₹600', '#b45309'),
          altText: 'Electronics breadboard kit',
        },
      ],
    },
  ];

  for (const item of sampleListings) {
    const listingCode = await generateUniquePublicCode(
      Listing,
      'listingCode',
      PUBLIC_ID_PREFIXES.LISTING
    );
    await Listing.create({
      ...item,
      listingCode,
      titleNormalized: item.title.toLowerCase(),
      isDemoSeed: true,
      moderation: {
        submittedAt: new Date(),
        reviewedAt: item.status === LISTING_STATUS.ACTIVE ? new Date() : null,
        reviewedBy: item.status === LISTING_STATUS.ACTIVE ? admin._id : null,
        rejectionReason: null,
      },
    });
  }

  const sampleResources = [
    {
      uploaderId: aarav._id,
      title: '[DEMO] CS301 Design & Analysis of Algorithms — End-Semester PYQ Bundle (2022–2025)',
      description:
        'Compiled end-semester and mid-semester university question papers with marking scheme notes for Dynamic Programming, Graph Algorithms, and NP-Completeness.',
      resourceType: RESOURCE_TYPE.PYQ,
      branch: 'CSE',
      academicYear: '2',
      semester: '4',
      subject: 'Design and Analysis of Algorithms',
      examYear: '2025',
      status: RESOURCE_STATUS.ACTIVE,
      downloadCount: 28,
    },
    {
      uploaderId: priya._id,
      title: '[DEMO] EC204 Signals & Systems — Complete Fourier & Laplace Transform Notes',
      description:
        'Structured lecture notes and solved tutorial sheets covering continuous/discrete-time Fourier transforms, Z-transform region of convergence, and LTI stability.',
      resourceType: RESOURCE_TYPE.NOTES,
      branch: 'ECE',
      academicYear: '2',
      semester: '3',
      subject: 'Signals and Systems',
      examYear: '2025',
      status: RESOURCE_STATUS.ACTIVE,
      downloadCount: 19,
    },
    {
      uploaderId: aarav._id,
      title: '[DEMO] CS304 Operating Systems — Kernel & Synchronization Lab Manual',
      description:
        'Lab exercises covering POSIX threads, semaphores, page replacement algorithms, and Linux procfs inspection.',
      resourceType: RESOURCE_TYPE.LAB_MANUAL,
      branch: 'CSE',
      academicYear: '3',
      semester: '5',
      subject: 'Operating Systems',
      examYear: '2025',
      status: RESOURCE_STATUS.PENDING,
      downloadCount: 0,
    },
  ];

  for (const resItem of sampleResources) {
    const resourceCode = await generateUniquePublicCode(
      Resource,
      'resourceCode',
      PUBLIC_ID_PREFIXES.RESOURCE
    );
    await Resource.create({
      ...resItem,
      resourceCode,
      isDemoSeed: true,
      file: {
        provider: 'local',
        fileId: `demo-res-${resourceCode.toLowerCase()}`,
        safeFileName: `${resourceCode.toLowerCase()}.pdf`,
        mimeType: 'application/pdf',
        byteSize: 245760,
        checksum: 'demo-sha256',
      },
      moderation: {
        submittedAt: new Date(),
        reviewedAt: resItem.status === RESOURCE_STATUS.ACTIVE ? new Date() : null,
        reviewedBy: resItem.status === RESOURCE_STATUS.ACTIVE ? admin._id : null,
      },
    });
  }

  return {
    skipped: false,
    adminEmail: admin.collegeEmail,
    studentEmails: [aarav.collegeEmail, priya.collegeEmail],
  };
}

const isDirect =
  process.argv[1] && process.argv[1].includes('seed-demo-data.js');

if (isDirect) {
  connectDatabase()
    .then(() => seedDemoDataIfEmpty())
    .then((res) => {
      console.log('Demo seed result:', res);
      return disconnectDatabase();
    })
    .catch((err) => {
      console.error('Failed to seed demo data:', err.message);
      process.exit(1);
    });
}
