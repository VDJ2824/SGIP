import { asyncHandler } from '../../common/asyncHandler.js';
import { buildPaginationMeta, getPagination } from '../../common/pagination.js';
import { sendCreated, sendResponse } from '../../common/response.js';
import { roadmapService } from './service.js';
import { createRoadmapPdf } from './roadmapPdf.service.js';

export const roadmapController = {
  generate: asyncHandler(async (req, res) => {
    const roadmap = await roadmapService.generate({
      userId: req.auth.userId,
      gapReportId: req.validated.body.gapReportId,
    });
    return sendCreated(res, req, roadmap);
  }),

  latest: asyncHandler(async (req, res) => {
    return sendResponse(res, req, await roadmapService.latest(req.auth.userId));
  }),

  getById: asyncHandler(async (req, res) => {
    return sendResponse(res, req, await roadmapService.getById(req.params.id, req.auth.userId));
  }),

  exportPdf: asyncHandler(async (req, res) => {
    const roadmap = await roadmapService.getById(req.params.id, req.auth.userId);
    const pdf = createRoadmapPdf(roadmap.toObject());

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sgip-roadmap.pdf"');
    res.setHeader('Cache-Control', 'private, no-store');
    pdf.pipe(res);
    pdf.end();
  }),

  history: asyncHandler(async (req, res) => {
    const pagination = getPagination(req);
    const { items, total } = await roadmapService.history(req.auth.userId, pagination);
    return sendResponse(res, req, items, buildPaginationMeta({ ...pagination, total }));
  }),

  updateTask: asyncHandler(async (req, res) => {
    const roadmap = await roadmapService.updateTask({
      userId: req.auth.userId,
      taskId: req.params.taskId,
      status: req.validated.body.status,
    });
    return sendResponse(res, req, roadmap);
  }),
};
