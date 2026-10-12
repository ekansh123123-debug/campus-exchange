import { AppError } from '../utils/app-error.js';

function assertNoMongoOperators(value, pathPrefix = '') {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, idx) => assertNoMongoOperators(item, `${pathPrefix}[${idx}]`));
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (key.startsWith('$') || key.includes('$') || key.includes('.')) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        `Disallowed query or payload key detected: ${pathPrefix ? `${pathPrefix}.${key}` : key}`
      );
    }
    assertNoMongoOperators(nested, pathPrefix ? `${pathPrefix}.${key}` : key);
  }
}

export function validateRequest(schemas = {}) {
  return function validationMiddleware(req, _res, next) {
    try {
      assertNoMongoOperators(req.params, 'params');
      assertNoMongoOperators(req.query, 'query');
      assertNoMongoOperators(req.body, 'body');

      if (schemas.params) {
        const parsed = schemas.params.safeParse(req.params);
        if (!parsed.success) {
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            'Invalid URL parameters.',
            parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
          );
        }
        req.validatedParams = parsed.data;
      }

      if (schemas.query) {
        const parsed = schemas.query.safeParse(req.query);
        if (!parsed.success) {
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            'Invalid query parameters.',
            parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
          );
        }
        req.validatedQuery = parsed.data;
      }

      if (schemas.body) {
        const parsed = schemas.body.safeParse(req.body || {});
        if (!parsed.success) {
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            parsed.error.issues[0]?.message || 'Please correct the highlighted fields.',
            parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
          );
        }
        req.validatedBody = parsed.data;
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}
