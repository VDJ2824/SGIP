import jwt from 'jsonwebtoken';
import { env } from '../config/index.js';
import { AppError, errorCodes } from '../errors/index.js';
import { User } from '../models/User.js';

function extractToken(header = '') {
  if (!header.startsWith('Bearer ')) return '';
  return header.slice(7).trim();
}

export async function authMiddleware(req, _res, next) {
  try {
    const token = extractToken(req.headers.authorization || '');
    if (!token) {
      throw new AppError('Authentication required', 401, errorCodes.VALIDATION_ERROR);
    }

    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.userId).select('-password -otp -otpExpiresAt');
    if (!user) {
      throw new AppError('Authentication required', 401, errorCodes.VALIDATION_ERROR);
    }
    if (user.isActive === false) {
      throw new AppError('Account is inactive', 403, errorCodes.VALIDATION_ERROR);
    }

    req.auth = {
      userId: String(user._id),
      user,
    };
    return next();
  } catch (error) {
    return next(error instanceof AppError ? error : new AppError('Invalid or expired token', 401, errorCodes.VALIDATION_ERROR));
  }
}
