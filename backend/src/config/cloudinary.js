import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';
import { logger } from '../common/logger.js';

export function configureCloudinary() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    logger.warn('Cloudinary not configured; media uploads will be unavailable');
    return cloudinary;
  }

  try {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  } catch (error) {
    logger.warn('Cloudinary configuration failed; media uploads will be unavailable', {
      message: error?.message || 'Unknown cloudinary configuration error',
    });
  }

  return cloudinary;
}

export { cloudinary };
