import { logger } from '../common/logger.js';

export function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on('finish', () => {
    logger.info('HTTP request completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
}
