import { User } from '../../models/User.model.js';
import { ACCOUNT_STATUS } from '../../constants/account-status.js';
import { AppError } from '../../utils/app-error.js';
import { toSafeCurrentUser, toSafePublicUser } from '../../utils/safe-user.js';

export async function getMyProfile(userId) {
  const user = await User.findById(userId);
  if (!user || user.accountStatus === ACCOUNT_STATUS.DELETED) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User profile not found.');
  }
  return toSafeCurrentUser(user);
}

export async function updateMyProfile(userId, payload) {
  const user = await User.findById(userId);
  if (!user || user.accountStatus === ACCOUNT_STATUS.DELETED) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User profile not found.');
  }

  if (payload.fullName !== undefined) {
    user.fullName = payload.fullName.trim();
  }
  if (payload.branch !== undefined) {
    user.branch = payload.branch;
  }
  if (payload.academicYear !== undefined) {
    user.academicYear = payload.academicYear;
  }
  if (payload.bio !== undefined) {
    user.bio = payload.bio.trim();
  }
  if (payload.avatarUrl !== undefined) {
    user.avatar = {
      provider: 'url',
      fileId: '',
      url: payload.avatarUrl.trim(),
    };
  }
  if (payload.contactPreferences !== undefined) {
    user.contactPreferences = {
      inAppChat:
        payload.contactPreferences.inAppChat ?? user.contactPreferences?.inAppChat ?? true,
      showBranchYear:
        payload.contactPreferences.showBranchYear ??
        user.contactPreferences?.showBranchYear ??
        true,
    };
  }

  await user.save();
  return toSafeCurrentUser(user);
}

export async function getPublicProfileByCode(userCode) {
  const user = await User.findOne({
    userCode,
    accountStatus: { $ne: ACCOUNT_STATUS.DELETED },
  });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Requested student profile was not found.');
  }
  return toSafePublicUser(user);
}
