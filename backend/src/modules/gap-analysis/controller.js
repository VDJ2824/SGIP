import { asyncHandler } from '../../common/asyncHandler.js';
import { buildPaginationMeta, getPagination } from '../../common/pagination.js';
import { sendCreated, sendResponse } from '../../common/response.js';
import { gapAnalysisService } from './service.js';

export const gapAnalysisController = {
  run: asyncHandler(async (req, res) => {
    const report = await gapAnalysisService.run({
      userId: req.auth.userId,
      careerRoleId: req.validated.body.careerRoleId,
    });
    return sendCreated(res, req, report);
  }),

  latest: asyncHandler(async (req, res) => {
    const report = await gapAnalysisService.latest(req.auth.userId);
    return sendResponse(res, req, report);
  }),

  getById: asyncHandler(async (req, res) => {
    const report = await gapAnalysisService.getById(req.params.id, req.auth.userId);
    return sendResponse(res, req, report);
  }),

  history: asyncHandler(async (req, res) => {
    const pagination = getPagination(req);
    const { items, total } = await gapAnalysisService.history(req.auth.userId, pagination);
    return sendResponse(res, req, items, buildPaginationMeta({ ...pagination, total }));
  }),

  archive: asyncHandler(async (req, res) => {
    const report = await gapAnalysisService.archive(req.params.id, req.auth.userId);
    return sendResponse(res, req, { archived: true, id: report._id });
  }),
};
