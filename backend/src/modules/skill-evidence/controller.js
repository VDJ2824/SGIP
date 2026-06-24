import { asyncHandler } from '../../common/asyncHandler.js';
import { buildPaginationMeta, getPagination } from '../../common/pagination.js';
import { sendCreated, sendResponse } from '../../common/response.js';
import { skillEvidenceService } from './service.js';

export const skillEvidenceController = {
  create: asyncHandler(async (req, res) => {
    const evidence = await skillEvidenceService.create({
      userId: req.auth.userId,
      reqUser: req.auth.user,
      payload: req.validated.body,
      file: req.file,
    });
    return sendCreated(res, req, evidence);
  }),

  listMine: asyncHandler(async (req, res) => {
    const pagination = getPagination(req);
    const { items, total } = await skillEvidenceService.listMine({
      userId: req.auth.userId,
      query: { ...req.query, skip: pagination.skip, limit: pagination.limit },
    });
    return sendResponse(res, req, items, buildPaginationMeta({ ...pagination, total }));
  }),

  listPending: asyncHandler(async (req, res) => {
    const pagination = getPagination(req);
    const { items, total } = await skillEvidenceService.listPending({
      reqUser: req.auth.user,
      query: { ...req.query, skip: pagination.skip, limit: pagination.limit },
    });
    return sendResponse(res, req, items, buildPaginationMeta({ ...pagination, total }));
  }),

  listSkillsMine: asyncHandler(async (req, res) => {
    const items = await skillEvidenceService.listSkillsMine(req.auth.userId);
    return sendResponse(res, req, items);
  }),

  getById: asyncHandler(async (req, res) => {
    const evidence = await skillEvidenceService.getById(req.params.id, req.auth.userId, req.auth.user);
    return sendResponse(res, req, evidence);
  }),

  review: asyncHandler(async (req, res) => {
    const evidence = await skillEvidenceService.review({
      id: req.params.id,
      reqUser: req.auth.user,
      payload: req.validated.body,
    });
    return sendResponse(res, req, evidence);
  }),

  delete: asyncHandler(async (req, res) => {
    const evidence = await skillEvidenceService.delete({
      id: req.params.id,
      userId: req.auth.userId,
      reqUser: req.auth.user,
    });
    return sendResponse(res, req, { deleted: true, id: evidence._id });
  }),
};
