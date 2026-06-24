import { AppError, errorCodes } from '../errors/index.js';

export function notFound(_req, _res, next) {
  next(new AppError('Route not found', 404, errorCodes.NOT_FOUND));
}
