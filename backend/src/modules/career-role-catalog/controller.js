import { asyncHandler } from '../../common/asyncHandler.js';
import { buildPaginationMeta, getPagination } from '../../common/pagination.js';
import { sendCreated, sendResponse } from '../../common/response.js';
import { careerRoleCatalogService } from './service.js';

export const careerRoleCatalogController = {
  create: asyncHandler(async (req, res) => {
    const role = await careerRoleCatalogService.create(req.validated.body);
    return sendCreated(res, req, role);
  }),

  list: asyncHandler(async (req, res) => {
    const pagination = getPagination(req);
    const { items, total } = await careerRoleCatalogService.list({
      ...req.query,
      skip: pagination.skip,
      limit: pagination.limit,
    });
    return sendResponse(res, req, items, buildPaginationMeta({ ...pagination, total }));
  }),

  getById: asyncHandler(async (req, res) => {
    const role = await careerRoleCatalogService.getById(req.params.id);
    return sendResponse(res, req, role);
  }),

  update: asyncHandler(async (req, res) => {
    const role = await careerRoleCatalogService.update(req.params.id, req.validated.body);
    return sendResponse(res, req, role);
  }),

  delete: asyncHandler(async (req, res) => {
    const role = await careerRoleCatalogService.delete(req.params.id);
    return sendResponse(res, req, { deleted: true, id: role._id });
  }),
};
