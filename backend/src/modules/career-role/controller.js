import { asyncHandler } from '../../common/asyncHandler.js';
import { buildPaginationMeta, getPagination } from '../../common/pagination.js';
import { sendCreated, sendResponse } from '../../common/response.js';
import { careerRoleService } from './service.js';

export const careerRoleController = {
  create: asyncHandler(async (req, res) => {
    const role = await careerRoleService.create(req.validated.body);
    return sendCreated(res, req, role);
  }),

  list: asyncHandler(async (req, res) => {
    const pagination = getPagination(req);
    const { items, total } = await careerRoleService.list({
      ...req.query,
      skip: pagination.skip,
      limit: pagination.limit,
    });
    return sendResponse(res, req, items, buildPaginationMeta({ ...pagination, total }));
  }),

  getById: asyncHandler(async (req, res) => {
    const role = await careerRoleService.getById(req.params.id);
    return sendResponse(res, req, role);
  }),

  update: asyncHandler(async (req, res) => {
    const role = await careerRoleService.update(req.params.id, req.validated.body);
    return sendResponse(res, req, role);
  }),

  delete: asyncHandler(async (req, res) => {
    const role = await careerRoleService.delete(req.params.id);
    return sendResponse(res, req, { deleted: true, id: role._id });
  }),

  intelligentSearch: asyncHandler(async (req, res) => {
    const result = await careerRoleService.searchOrGenerate(req.validated.body.query);
    return sendResponse(res, req, result);
  }),
};

