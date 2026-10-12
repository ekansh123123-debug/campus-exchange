import mongoose from 'mongoose';
import { LISTING_STATUS } from '../../constants/listing-status.js';
import { ROLES } from '../../constants/roles.js';
import { Category } from '../../models/Category.model.js';
import { Listing } from '../../models/Listing.model.js';
import { ensureCategoriesSeeded, toCategoryDto } from '../categories/categories.service.js';
import {
  generateUniquePublicCode,
  PUBLIC_ID_PREFIXES,
} from '../../services/public-id.service.js';
import {
  deleteStoredMedia,
  validateAndUploadImage,
} from '../../services/media.service.js';
import { createNotification } from '../../services/notification.service.js';
import { recordAuditEvent } from '../../services/audit.service.js';
import { AppError } from '../../utils/app-error.js';
import { parsePagination } from '../../utils/pagination.js';
import { toSafePublicUser } from '../../utils/safe-user.js';

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function resolvePricePaise(payload) {
  if (
    payload.pricePaise !== undefined &&
    payload.pricePaise !== null &&
    String(payload.pricePaise).trim() !== ''
  ) {
    return Math.round(Number(payload.pricePaise));
  }
  return Math.round(Number(payload.price) * 100);
}

async function resolveCategory(categoryId, categorySlug) {
  await ensureCategoriesSeeded();
  if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
    const byId = await Category.findOne({ _id: categoryId, active: true });
    if (byId) return byId;
  }
  const slugCandidate = String(categorySlug || categoryId || '')
    .trim()
    .toLowerCase();
  if (slugCandidate) {
    const bySlug = await Category.findOne({ slug: slugCandidate, active: true });
    if (bySlug) return bySlug;
  }
  throw new AppError(400, 'INVALID_CATEGORY', 'Selected listing category does not exist or is inactive.');
}

export function toListingDto(listingDoc, viewer = null) {
  const l = typeof listingDoc.toObject === 'function' ? listingDoc.toObject() : listingDoc;
  const sellerIdStr = String(l.sellerId?._id || l.sellerId);
  const viewerIdStr = viewer ? String(viewer._id || viewer.id) : '';
  const isOwner = Boolean(viewerIdStr && viewerIdStr === sellerIdStr);
  const isAdmin = viewer?.role === ROLES.ADMIN;

  const dto = {
    id: String(l._id || l.id),
    listingCode: l.listingCode,
    title: l.title,
    description: l.description,
    listingType: l.listingType,
    pricePaise: l.pricePaise,
    priceInr: Number((l.pricePaise / 100).toFixed(2)),
    condition: l.condition,
    images: (l.images || []).map((img) => ({
      url: img.url,
      thumbnailUrl: img.thumbnailUrl || img.url,
      altText: img.altText || l.title,
    })),
    branch: l.branch || 'GENERAL',
    academicYear: l.academicYear || '',
    semester: l.semester || '',
    subject: l.subject || '',
    edition: l.edition || '',
    author: l.author || '',
    exchangePreference: l.exchangePreference || '',
    status: l.status,
    isOwner,
    isDemoSeed: Boolean(l.isDemoSeed),
    category:
      l.categoryId && typeof l.categoryId === 'object' && l.categoryId.slug
        ? toCategoryDto(l.categoryId)
        : null,
    seller:
      l.sellerId && typeof l.sellerId === 'object' && l.sellerId.userCode
        ? toSafePublicUser(l.sellerId)
        : null,
    createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : null,
    updatedAt: l.updatedAt ? new Date(l.updatedAt).toISOString() : null,
  };

  if (isOwner || isAdmin) {
    dto.moderation = {
      submittedAt: l.moderation?.submittedAt
        ? new Date(l.moderation.submittedAt).toISOString()
        : null,
      reviewedAt: l.moderation?.reviewedAt
        ? new Date(l.moderation.reviewedAt).toISOString()
        : null,
      rejectionReason: l.moderation?.rejectionReason || null,
    };
  }

  return dto;
}

export async function createListing({
  actor,
  payload,
  files = [],
  requestId = '',
}) {
  const category = await resolveCategory(payload.categoryId, payload.categorySlug);
  const pricePaise = resolvePricePaise(payload);

  const uploadedImages = [];
  try {
    for (const file of files) {
      const uploaded = await validateAndUploadImage(file);
      uploadedImages.push(uploaded);
    }

    const listingCode = await generateUniquePublicCode(
      Listing,
      'listingCode',
      PUBLIC_ID_PREFIXES.LISTING
    );

    const listing = await Listing.create({
      listingCode,
      sellerId: actor._id,
      categoryId: category._id,
      title: payload.title.trim(),
      titleNormalized: payload.title.trim().toLowerCase(),
      description: payload.description.trim(),
      listingType: payload.listingType,
      pricePaise,
      condition: payload.condition,
      images: uploadedImages,
      branch: (payload.branch || 'GENERAL').toUpperCase(),
      academicYear: payload.academicYear || '',
      semester: payload.semester || '',
      subject: payload.subject || '',
      edition: payload.edition || '',
      author: payload.author || '',
      exchangePreference: payload.exchangePreference || '',
      status: LISTING_STATUS.PENDING,
      moderation: {
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
      },
    });

    await listing.populate(['categoryId', 'sellerId']);

    await createNotification({
      userId: actor._id,
      eventType: 'listing_submitted',
      title: 'Listing Submitted for Moderation',
      body: `Your listing "${listing.title}" (${listing.listingCode}) is pending administrator review.`,
      linkPath: `/my-listings`,
    });

    await recordAuditEvent({
      actorId: actor._id,
      actorRole: actor.role,
      action: 'listing.created',
      targetType: 'listing',
      targetId: listing.listingCode,
      requestId,
    });

    return toListingDto(listing, actor);
  } catch (err) {
    for (const img of uploadedImages) {
      await deleteStoredMedia(img.provider, img.fileId);
    }
    throw err;
  }
}

export async function searchActiveListings(actor, query = {}) {
  await ensureCategoriesSeeded();
  const { page, limit, skip } = parsePagination(query);

  const filter = {
    status: LISTING_STATUS.ACTIVE,
  };

  if (query.category) {
    if (mongoose.Types.ObjectId.isValid(query.category)) {
      filter.categoryId = query.category;
    } else {
      const cat = await Category.findOne({
        slug: String(query.category).trim().toLowerCase(),
      });
      if (!cat) {
        return { items: [], meta: { page, limit, total: 0 } };
      }
      filter.categoryId = cat._id;
    }
  }

  if (query.branch) {
    filter.branch = String(query.branch).trim().toUpperCase();
  }

  const yearFilter = query.year || query.academicYear;
  if (yearFilter) {
    filter.academicYear = String(yearFilter).trim();
  }

  if (query.semester) {
    filter.semester = String(query.semester).trim();
  }

  if (query.condition) {
    filter.condition = query.condition;
  }

  if (query.listingType) {
    filter.listingType = query.listingType;
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.pricePaise = {};
    if (query.minPrice !== undefined) {
      filter.pricePaise.$gte = Math.round(Number(query.minPrice) * 100);
    }
    if (query.maxPrice !== undefined) {
      filter.pricePaise.$lte = Math.round(Number(query.maxPrice) * 100);
    }
  }

  const andConditions = [];

  if (query.subject) {
    const safeSubj = escapeRegex(query.subject.trim());
    andConditions.push({
      subject: { $regex: safeSubj, $options: 'i' },
    });
  }

  if (query.q) {
    const safeQ = escapeRegex(query.q.trim());
    andConditions.push({
      $or: [
        { title: { $regex: safeQ, $options: 'i' } },
        { subject: { $regex: safeQ, $options: 'i' } },
        { author: { $regex: safeQ, $options: 'i' } },
        { description: { $regex: safeQ, $options: 'i' } },
      ],
    });
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  let sortSpec = { createdAt: -1, _id: -1 };
  if (query.sort === 'price_asc') {
    sortSpec = { pricePaise: 1, createdAt: -1, _id: -1 };
  } else if (query.sort === 'price_desc') {
    sortSpec = { pricePaise: -1, createdAt: -1, _id: -1 };
  }

  const [rows, total] = await Promise.all([
    Listing.find(filter)
      .sort(sortSpec)
      .skip(skip)
      .limit(limit)
      .populate(['categoryId', 'sellerId']),
    Listing.countDocuments(filter),
  ]);

  return {
    items: rows.map((r) => toListingDto(r, actor)),
    meta: { page, limit, total },
  };
}

export async function listMyListings(actor, query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { sellerId: actor._id };
  if (query.status && typeof query.status === 'string') {
    filter.status = query.status;
  }

  const [rows, total] = await Promise.all([
    Listing.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate(['categoryId', 'sellerId']),
    Listing.countDocuments(filter),
  ]);

  return {
    items: rows.map((r) => toListingDto(r, actor)),
    meta: { page, limit, total },
  };
}

export async function getListingByCode(actor, listingCode) {
  const listing = await Listing.findOne({ listingCode }).populate([
    'categoryId',
    'sellerId',
  ]);

  if (!listing) {
    throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  }

  const isOwner = Boolean(
    actor?._id && String(listing.sellerId?._id || listing.sellerId) === String(actor._id)
  );
  const isAdmin = actor?.role === ROLES.ADMIN;
  const publiclyVisibleStatuses = [
    LISTING_STATUS.ACTIVE,
    LISTING_STATUS.RESERVED,
    LISTING_STATUS.SOLD,
  ];

  if (!publiclyVisibleStatuses.includes(listing.status) && !isOwner && !isAdmin) {
    throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  }

  return toListingDto(listing, actor);
}

export async function updateOwnListing({
  actor,
  listingCode,
  payload,
  files = [],
  requestId = '',
}) {
  const listing = await Listing.findOne({ listingCode });
  if (!listing) {
    throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  }

  if (String(listing.sellerId) !== String(actor._id)) {
    throw new AppError(403, 'FORBIDDEN', 'You can only edit your own listings.');
  }

  const editableStates = [
    LISTING_STATUS.DRAFT,
    LISTING_STATUS.PENDING,
    LISTING_STATUS.ACTIVE,
    LISTING_STATUS.REJECTED,
  ];

  if (!editableStates.includes(listing.status)) {
    throw new AppError(
      409,
      'INVALID_LISTING_STATE',
      `Listings in "${listing.status}" state cannot be edited.`
    );
  }

  if (payload.categoryId || payload.categorySlug) {
    const category = await resolveCategory(payload.categoryId, payload.categorySlug);
    listing.categoryId = category._id;
  }

  if (payload.title !== undefined) {
    listing.title = payload.title.trim();
    listing.titleNormalized = payload.title.trim().toLowerCase();
  }
  if (payload.description !== undefined) {
    listing.description = payload.description.trim();
  }
  if (payload.listingType !== undefined) {
    listing.listingType = payload.listingType;
  }
  if (payload.price !== undefined || payload.pricePaise !== undefined) {
    listing.pricePaise = resolvePricePaise(payload);
  }
  if (payload.condition !== undefined) {
    listing.condition = payload.condition;
  }
  if (payload.branch !== undefined) {
    listing.branch = payload.branch.toUpperCase();
  }
  if (payload.academicYear !== undefined) {
    listing.academicYear = payload.academicYear;
  }
  if (payload.semester !== undefined) {
    listing.semester = payload.semester;
  }
  if (payload.subject !== undefined) {
    listing.subject = payload.subject;
  }
  if (payload.edition !== undefined) {
    listing.edition = payload.edition;
  }
  if (payload.author !== undefined) {
    listing.author = payload.author;
  }
  if (payload.exchangePreference !== undefined) {
    listing.exchangePreference = payload.exchangePreference;
  }

  if (files && files.length > 0) {
    const newImages = [];
    for (const file of files) {
      const uploaded = await validateAndUploadImage(file);
      newImages.push(uploaded);
    }
    listing.images = newImages;
  }

  listing.status = LISTING_STATUS.PENDING;
  listing.moderation = {
    submittedAt: new Date(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
  };

  await listing.save();
  await listing.populate(['categoryId', 'sellerId']);

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'listing.updated_and_resubmitted',
    targetType: 'listing',
    targetId: listing.listingCode,
    requestId,
  });

  return toListingDto(listing, actor);
}

export async function submitListingForModeration({
  actor,
  listingCode,
  requestId = '',
}) {
  const listing = await Listing.findOne({ listingCode });
  if (!listing) {
    throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  }

  if (String(listing.sellerId) !== String(actor._id)) {
    throw new AppError(403, 'FORBIDDEN', 'You can only submit your own listings.');
  }

  const submittableStates = [
    LISTING_STATUS.DRAFT,
    LISTING_STATUS.REJECTED,
    LISTING_STATUS.PENDING,
  ];

  if (!submittableStates.includes(listing.status)) {
    throw new AppError(
      409,
      'INVALID_LISTING_STATE',
      `Listing in "${listing.status}" state cannot be resubmitted for moderation.`
    );
  }

  listing.status = LISTING_STATUS.PENDING;
  listing.moderation = {
    submittedAt: new Date(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
  };

  await listing.save();
  await listing.populate(['categoryId', 'sellerId']);

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'listing.submitted',
    targetType: 'listing',
    targetId: listing.listingCode,
    requestId,
  });

  return toListingDto(listing, actor);
}

export async function removeOwnListing({
  actor,
  listingCode,
  requestId = '',
}) {
  const listing = await Listing.findOne({ listingCode });
  if (!listing) {
    throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  }

  if (String(listing.sellerId) !== String(actor._id)) {
    throw new AppError(403, 'FORBIDDEN', 'You can only remove your own listings.');
  }

  const removableStates = [
    LISTING_STATUS.DRAFT,
    LISTING_STATUS.PENDING,
    LISTING_STATUS.ACTIVE,
    LISTING_STATUS.REJECTED,
  ];

  if (!removableStates.includes(listing.status)) {
    throw new AppError(
      409,
      'INVALID_LISTING_STATE',
      `Listing in "${listing.status}" state cannot be removed while reserved or sold.`
    );
  }

  listing.status = LISTING_STATUS.REMOVED;
  listing.removedAt = new Date();
  listing.removedBy = actor._id;
  listing.removalReason = 'Removed by owner';
  await listing.save();
  await listing.populate(['categoryId', 'sellerId']);

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'listing.removed',
    targetType: 'listing',
    targetId: listing.listingCode,
    requestId,
  });

  return toListingDto(listing, actor);
}
