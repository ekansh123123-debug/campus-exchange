import multer from 'multer';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/app-error.js';

export function errorHandler(err, req, res, _next) {
  const requestId = req.requestId || '';

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details || [],
        requestId,
      },
    });
  }

  if (err instanceof multer.MulterError) {
    const isSizeError = err.code === 'LIMIT_FILE_SIZE';
    const isCountError = err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE';
    return res.status(isSizeError ? 413 : 400).json({
      success: false,
      error: {
        code: isSizeError
          ? 'FILE_TOO_LARGE'
          : isCountError
          ? 'FILE_COUNT_EXCEEDED'
          : 'UPLOAD_VALIDATION_ERROR',
        message: isSizeError
          ? 'Uploaded file exceeds the configured maximum size limit.'
          : isCountError
          ? 'Too many files or unexpected upload field name.'
          : 'Invalid file upload request.',
        details: [],
        requestId,
      },
    });
  }

  if (err && err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_RECORD',
        message: 'A record with the same unique identifier or constraint already exists.',
        details: [],
        requestId,
      },
    });
  }

  if (err && err.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((e) => ({
      path: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please correct the highlighted fields.',
        details,
        requestId,
      },
    });
  }

  if (err && err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_IDENTIFIER',
        message: 'The supplied identifier format is invalid.',
        details: [],
        requestId,
      },
    });
  }

  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MALFORMED_JSON',
        message: 'Request body contains malformed JSON.',
        details: [],
        requestId,
      },
    });
  }

  if (err && err.code === 'CORS_ORIGIN_DENIED') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CORS_ORIGIN_DENIED',
        message: 'Origin not allowed by CORS policy.',
        details: [],
        requestId,
      },
    });
  }

  logger.error(
    {
      requestId,
      method: req.method,
      path: req.originalUrl,
      errorName: err?.name,
      errorMessage: err?.message,
    },
    'Unhandled application error'
  );

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
      details: [],
      requestId,
    },
  });
}
