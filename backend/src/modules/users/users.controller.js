import { asyncHandler } from '../../utils/async-handler.js';
import { sendSuccess } from '../../utils/api-response.js';
import {
  getMyProfile,
  getPublicProfileByCode,
  updateMyProfile,
} from './users.service.js';

export const getMyProfileController = asyncHandler(async (req, res) => {
  const profile = await getMyProfile(req.user._id);
  return sendSuccess(res, { user: profile }, 200);
});

export const updateMyProfileController = asyncHandler(async (req, res) => {
  const profile = await updateMyProfile(req.user._id, req.validatedBody);
  return sendSuccess(res, { user: profile }, 200);
});

export const getPublicProfileController = asyncHandler(async (req, res) => {
  const profile = await getPublicProfileByCode(req.validatedParams.userCode);
  return sendSuccess(res, { profile }, 200);
});
