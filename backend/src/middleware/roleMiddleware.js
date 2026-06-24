import { AppError, errorCodes } from '../errors/index.js';

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.auth?.user || !roles.includes(req.auth.user.role)) {
      return next(new AppError('You do not have permission to access this resource', 403, errorCodes.VALIDATION_ERROR));
    }
    return next();
  };
}

export const requireAdmin = requireRole('admin');
export const requireMentor = requireRole('mentor');
export const requireStudent = requireRole('student');
