import { AppError } from '../utils/app-error.js';

export function requireRole(...allowedRoles) {
  return function roleMiddleware(req, _res, next) {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication is required.'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(403, 'FORBIDDEN', 'You do not have permission to access this resource.')
      );
    }
    return next();
  };
}
