import { AppError } from '../errors/index.js';
import { logger } from '../common/logger.js';
import { getEmailFromAddress, smtpTransport } from '../config/smtp.js';

export async function sendEmail({ to, subject, text, html }) {
  if (!smtpTransport) {
    throw new AppError('Email service is not configured', 503, 'EMAIL_SERVICE_NOT_CONFIGURED');
  }

  try {
    return await smtpTransport.sendMail({
      from: getEmailFromAddress(),
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    logger.warn('SMTP sendMail failed', {
      to,
      subject,
      message: error?.message || 'Unknown SMTP send error',
    });
    throw new AppError('Email service is not configured', 503, 'EMAIL_SERVICE_NOT_CONFIGURED');
  }
}
