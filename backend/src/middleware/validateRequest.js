import { AppError, errorCodes } from '../errors/index.js';

function formatZodErrors(error) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

export function validateRequest(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
      file: req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : undefined,
    });

    if (!result.success) {
      return next(
        new AppError('Validation failed', 400, errorCodes.VALIDATION_ERROR, formatZodErrors(result.error)),
      );
    }

    req.validated = result.data;
    return next();
  };
}
