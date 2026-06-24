function buildMeta(req, meta = {}) {
  return {
    requestId: req.requestId || req.id || '',
    timestamp: new Date().toISOString(),
    ...meta,
  };
}

export function sendResponse(res, req, data = null, meta = {}, statusCode = 200) {
  return res.status(statusCode).json({
    data,
    meta: buildMeta(req, meta),
    error: null,
  });
}

export function sendCreated(res, req, data, meta = {}) {
  return sendResponse(res, req, data, meta, 201);
}

export function sendErrorResponse(res, req, error, statusCode = 500, details = null) {
  return res.status(statusCode).json({
    data: null,
    meta: buildMeta(req),
    error: {
      message: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_SERVER_ERROR',
      details,
    },
  });
}
