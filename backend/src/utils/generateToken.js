import jwt from 'jsonwebtoken';
import { env } from '../config/index.js';

export function generateToken(userId) {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}
