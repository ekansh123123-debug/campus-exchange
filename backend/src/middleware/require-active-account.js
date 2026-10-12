import { ACCOUNT_STATUS } from '../constants/account-status.js';
import { AppError } from '../utils/app-error.js';

export function requireActiveAccount(req, _res, next) {
  if (!req.user) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Authentication is required.'));
  }
  if (req.user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    return next(
      new AppError(403, 'ACCOUNT_NOT_ACTIVE', 'Your account is not active for this operation.')
    );
  }
  return next();
}
