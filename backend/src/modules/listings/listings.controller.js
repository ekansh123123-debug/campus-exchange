import { asyncHandler } from '../../utils/async-handler.js';
import { sendPaginated, sendSuccess } from '../../utils/api-response.js';
import {
  createListing,
  getListingByCode,
  listMyListings,
  removeOwnListing,
  searchActiveListings,
  submitListingForModeration,
  updateOwnListing,
} from './listings.service.js';

export const createListingController = asyncHandler(async (req, res) => {
  const listing = await createListing({
    actor: req.user,
    payload: req.validatedBody,
    files: req.files || [],
    requestId: req.requestId,
  });
  return sendSuccess(res, { listing }, 201);
});

export const searchListingsController = asyncHandler(async (req, res) => {
  const result = await searchActiveListings(req.user, req.validatedQuery || req.query);
  return sendPaginated(res, result.items, result.meta, 200);
});

export const listMyListingsController = asyncHandler(async (req, res) => {
  const result = await listMyListings(req.user, req.query);
  return sendPaginated(res, result.items, result.meta, 200);
});

export const getListingDetailController = asyncHandler(async (req, res) => {
  const listing = await getListingByCode(req.user, req.validatedParams.listingCode);
  return sendSuccess(res, { listing }, 200);
});

export const updateListingController = asyncHandler(async (req, res) => {
  const listing = await updateOwnListing({
    actor: req.user,
    listingCode: req.validatedParams.listingCode,
    payload: req.validatedBody,
    files: req.files || [],
    requestId: req.requestId,
  });
  return sendSuccess(res, { listing }, 200);
});

export const submitListingController = asyncHandler(async (req, res) => {
  const listing = await submitListingForModeration({
    actor: req.user,
    listingCode: req.validatedParams.listingCode,
    requestId: req.requestId,
  });
  return sendSuccess(res, { listing }, 200);
});

export const removeListingController = asyncHandler(async (req, res) => {
  const listing = await removeOwnListing({
    actor: req.user,
    listingCode: req.validatedParams.listingCode,
    requestId: req.requestId,
  });
  return sendSuccess(res, { listing }, 200);
});
