import { verifyAccessToken } from '../services/token.service.js';
import { User } from '../models/User.model.js';
import { ACCOUNT_STATUS } from '../constants/account-status.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required to access this resource.');
  }

  const rawToken = authHeader.slice(7).trim();
  if (!rawToken) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication token is missing.');
  }

  const decoded = verifyAccessToken(rawToken);
  const userDoc = await User.findById(decoded.sub);

  if (!userDoc || userDoc.accountStatus === ACCOUNT_STATUS.DELETED) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authenticated account no longer exists.');
  }

  if (userDoc.accountStatus === ACCOUNT_STATUS.BLOCKED) {
    throw new AppError(
      403,
      'ACCOUNT_BLOCKED',
      'Your account has been suspended by an administrator.'
    );
  }

  req.user = {
    _id: userDoc._id,
    id: String(userDoc._id),
    userCode: userDoc.userCode,
    fullName: userDoc.fullName,
    collegeEmail: userDoc.collegeEmail,
    role: userDoc.role,
    emailVerifiedAt: userDoc.emailVerifiedAt,
    isEmailVerified: Boolean(userDoc.emailVerifiedAt),
    accountStatus: userDoc.accountStatus,
    branch: userDoc.branch,
    academicYear: userDoc.academicYear,
  };

  next();
});

export const optionalAuthenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const rawToken = authHeader.slice(7).trim();
  if (!rawToken) {
    req.user = null;
    return next();
  }

  const decoded = verifyAccessToken(rawToken);
  const userDoc = await User.findById(decoded.sub);

  if (!userDoc || userDoc.accountStatus === ACCOUNT_STATUS.DELETED) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authenticated account no longer exists.');
  }

  if (userDoc.accountStatus === ACCOUNT_STATUS.BLOCKED) {
    throw new AppError(
      403,
      'ACCOUNT_BLOCKED',
      'Your account has been suspended by an administrator.'
    );
  }

  req.user = {
    _id: userDoc._id,
    id: String(userDoc._id),
    userCode: userDoc.userCode,
    fullName: userDoc.fullName,
    collegeEmail: userDoc.collegeEmail,
    role: userDoc.role,
    emailVerifiedAt: userDoc.emailVerifiedAt,
    isEmailVerified: Boolean(userDoc.emailVerifiedAt),
    accountStatus: userDoc.accountStatus,
    branch: userDoc.branch,
    academicYear: userDoc.academicYear,
  };

  return next();
});
