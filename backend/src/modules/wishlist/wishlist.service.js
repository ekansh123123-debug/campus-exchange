import { LISTING_STATUS } from '../../constants/listing-status.js';
import { Listing } from '../../models/Listing.model.js';
import { Wishlist } from '../../models/Wishlist.model.js';
import { toListingDto } from '../listings/listings.service.js';
import { AppError } from '../../utils/app-error.js';
import { parsePagination } from '../../utils/pagination.js';

export async function listMyWishlist(actor, query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { userId: actor._id };

  const [rows, total] = await Promise.all([
    Wishlist.find(filter)
      .sort({ savedAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'listingId',
        populate: ['categoryId', 'sellerId'],
      }),
    Wishlist.countDocuments(filter),
  ]);

  const items = rows
    .filter((row) => Boolean(row.listingId))
    .map((row) => ({
      savedAt: row.savedAt ? new Date(row.savedAt).toISOString() : null,
      listing: toListingDto(row.listingId, actor),
    }));

  return {
    items,
    meta: { page, limit, total },
  };
}

export async function addListingToWishlist(actor, listingCode) {
  const listing = await Listing.findOne({ listingCode }).populate([
    'categoryId',
    'sellerId',
  ]);

  if (
    !listing ||
    ![LISTING_STATUS.ACTIVE, LISTING_STATUS.RESERVED].includes(listing.status)
  ) {
    throw new AppError(
      404,
      'LISTING_NOT_FOUND',
      'Only active listings can be saved to your wishlist.'
    );
  }

  const existing = await Wishlist.findOne({
    userId: actor._id,
    listingId: listing._id,
  });

  if (existing) {
    throw new AppError(
      409,
      'ALREADY_IN_WISHLIST',
      'This listing is already in your wishlist.'
    );
  }

  try {
    const entry = await Wishlist.create({
      userId: actor._id,
      listingId: listing._id,
      savedAt: new Date(),
    });
    return {
      savedAt: entry.savedAt.toISOString(),
      listing: toListingDto(listing, actor),
    };
  } catch (err) {
    if (err && err.code === 11000) {
      throw new AppError(
        409,
        'ALREADY_IN_WISHLIST',
        'This listing is already in your wishlist.'
      );
    }
    throw err;
  }
}

export async function removeListingFromWishlist(actor, listingCode) {
  const listing = await Listing.findOne({ listingCode });
  if (!listing) {
    throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  }

  const deleted = await Wishlist.findOneAndDelete({
    userId: actor._id,
    listingId: listing._id,
  });

  if (!deleted) {
    throw new AppError(
      404,
      'WISHLIST_ENTRY_NOT_FOUND',
      'This item was not found in your wishlist.'
    );
  }

  return { removed: true, listingCode };
}
