import { AppError, errorCodes } from '../errors/index.js';
import { env } from '../config/index.js';

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const allowedEvidenceMimeTypes = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
]);

export function getResumeMaxBytes() {
  return Number(env.RESUME_MAX_FILE_SIZE_MB || 5) * 1024 * 1024;
}

export function getEvidenceMaxBytes() {
  return Number(env.RESUME_MAX_FILE_SIZE_MB || 5) * 1024 * 1024;
}

export function validateResumeFile(file) {
  if (!file) {
    throw new AppError('Resume file is required', 400, errorCodes.VALIDATION_ERROR);
  }

  if (!file.size) {
    throw new AppError('Resume file is empty', 400, errorCodes.VALIDATION_ERROR);
  }

  if (file.size > getResumeMaxBytes()) {
    throw new AppError(`Resume file must be ${env.RESUME_MAX_FILE_SIZE_MB || 5}MB or smaller`, 400, errorCodes.VALIDATION_ERROR);
  }

  if (!allowedMimeTypes.has(file.mimetype)) {
    throw new AppError('Only PDF and DOCX resumes are supported', 400, errorCodes.VALIDATION_ERROR);
  }
}

export function resumeFileFilter(_req, file, callback) {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return callback(new AppError('Only PDF and DOCX resumes are supported', 400, errorCodes.VALIDATION_ERROR));
  }

  return callback(null, true);
}

export function validateEvidenceFile(file) {
  if (!file) return;

  if (!file.size) {
    throw new AppError('Evidence file is empty', 400, errorCodes.VALIDATION_ERROR);
  }

  if (file.size > getEvidenceMaxBytes()) {
    throw new AppError(`Evidence file must be ${env.RESUME_MAX_FILE_SIZE_MB || 5}MB or smaller`, 400, errorCodes.VALIDATION_ERROR);
  }

  if (!allowedEvidenceMimeTypes.has(file.mimetype)) {
    throw new AppError('Only PDF, PNG, JPG, and JPEG evidence files are supported', 400, errorCodes.VALIDATION_ERROR);
  }
}

export function evidenceFileFilter(_req, file, callback) {
  if (!allowedEvidenceMimeTypes.has(file.mimetype)) {
    return callback(new AppError('Only PDF, PNG, JPG, and JPEG evidence files are supported', 400, errorCodes.VALIDATION_ERROR));
  }

  return callback(null, true);
}
