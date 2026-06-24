import { ZodError } from 'zod';
import { AppError } from '../errors/index.js';
import { sendErrorResponse } from '../common/response.js';

export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return sendErrorResponse(
      res,
      req,
      new AppError('Validation failed', 400, 'VALIDATION_ERROR'),
      400,
      err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }

  if (err instanceof AppError) {
    return sendErrorResponse(res, req, err, err.statusCode, err.details);
  }

  return sendErrorResponse(
    res,
    req,
    new AppError('Internal server error'),
    500,
    process.env.NODE_ENV === 'development' ? { stack: err?.stack } : null,
  );
}
