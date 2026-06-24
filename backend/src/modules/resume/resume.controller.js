import { asyncHandler } from '../../common/asyncHandler.js';
import { buildPaginationMeta, getPagination } from '../../common/pagination.js';
import { sendCreated, sendResponse } from '../../common/response.js';
import { resumeService } from './resume.service.js';

export const resumeController = {
  upload: asyncHandler(async (req, res) => {
    const result = await resumeService.upload({
      file: req.file,
      userId: req.auth.userId,
    });
    return sendCreated(res, req, {
      id: result.resume._id,
      file: {
        originalFileName: result.resume.originalFileName,
        fileUrl: result.resume.fileUrl,
        fileMimeType: result.resume.fileMimeType,
        fileSize: result.resume.fileSize,
      },
      status: result.resume.status,
      preview: result.preview,
      redactionSummary: result.redactionSummary,
      resume: result.resume,
    });
  }),

  extractSkills: asyncHandler(async (req, res) => {
    const result = await resumeService.extractSkills({
      id: req.params.id,
      userId: req.auth.userId,
    });
    return sendResponse(res, req, result);
  }),

  review: asyncHandler(async (req, res) => {
    const result = await resumeService.review({
      id: req.params.id,
      userId: req.auth.userId,
      skills: req.validated.body.skills,
    });
    return sendResponse(res, req, result);
  }),

  list: asyncHandler(async (req, res) => {
    const pagination = getPagination(req);
    const { items, total } = await resumeService.list({
      userId: req.auth.userId,
      skip: pagination.skip,
      limit: pagination.limit,
    });
    return sendResponse(res, req, items, buildPaginationMeta({ ...pagination, total }));
  }),

  getById: asyncHandler(async (req, res) => {
    const resume = await resumeService.getById({
      id: req.params.id,
      userId: req.auth.userId,
      includeRawText: req.query.includeRawText === 'true',
    });
    return sendResponse(res, req, resume);
  }),

  delete: asyncHandler(async (req, res) => {
    const result = await resumeService.delete({
      id: req.params.id,
      userId: req.auth.userId,
    });
    return sendResponse(res, req, result);
  }),
};
