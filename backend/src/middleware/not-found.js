import { AppError } from '../utils/app-error.js';

export function notFoundHandler(req, _res, next) {
  next(
    new AppError(
      404,
      'ROUTE_NOT_FOUND',
      `Requested endpoint ${req.method} ${req.originalUrl} does not exist.`
    )
  );
}
