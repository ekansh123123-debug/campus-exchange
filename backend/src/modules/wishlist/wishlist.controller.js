import { asyncHandler } from '../../utils/async-handler.js';
import { sendPaginated, sendSuccess } from '../../utils/api-response.js';
import {
  addListingToWishlist,
  listMyWishlist,
  removeListingFromWishlist,
} from './wishlist.service.js';

export const listWishlistController = asyncHandler(async (req, res) => {
  const result = await listMyWishlist(req.user, req.query);
  return sendPaginated(res, result.items, result.meta, 200);
});

export const addWishlistController = asyncHandler(async (req, res) => {
  const item = await addListingToWishlist(req.user, req.validatedBody.listingCode);
  return sendSuccess(res, { item }, 201);
});

export const removeWishlistController = asyncHandler(async (req, res) => {
  const result = await removeListingFromWishlist(
    req.user,
    req.validatedParams.listingCode
  );
  return sendSuccess(res, result, 200);
});
