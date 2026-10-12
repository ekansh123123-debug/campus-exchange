import { ACCOUNT_STATUS } from '../constants/account-status.js';
import { AppError } from '../utils/app-error.js';

export function requireVerifiedStudent(req, _res, next) {
  if (!req.user) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Authentication is required.'));
  }
  if (req.user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    return next(
      new AppError(403, 'ACCOUNT_BLOCKED', 'Your account is not active.')
    );
  }
  if (!req.user.emailVerifiedAt) {
    return next(
      new AppError(
        403,
        'EMAIL_NOT_VERIFIED',
        'Please verify your college email address before performing marketplace or resource actions.'
      )
    );
  }
  return next();
}
