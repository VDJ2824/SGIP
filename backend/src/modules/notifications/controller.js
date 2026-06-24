import { asyncHandler } from '../../common/asyncHandler.js';
import { buildPaginationMeta, getPagination } from '../../common/pagination.js';
import { sendCreated, sendResponse } from '../../common/response.js';
import { notificationsService } from './service.js';

export const notificationsController = {
  create: asyncHandler(async (req, res) => {
    const notification = await notificationsService.create(req.validated.body);
    return sendCreated(res, req, notification);
  }),

  list: asyncHandler(async (req, res) => {
    const pagination = getPagination(req);
    const { items, total } = await notificationsService.list({
      ...req.query,
      skip: pagination.skip,
      limit: pagination.limit,
    });
    return sendResponse(res, req, items, buildPaginationMeta({ ...pagination, total }));
  }),

  getById: asyncHandler(async (req, res) => {
    const notification = await notificationsService.getById(req.params.id);
    return sendResponse(res, req, notification);
  }),

  markRead: asyncHandler(async (req, res) => {
    const notification = await notificationsService.markRead(req.params.id, req.validated.body.read);
    return sendResponse(res, req, notification);
  }),

  delete: asyncHandler(async (req, res) => {
    const notification = await notificationsService.delete(req.params.id);
    return sendResponse(res, req, { deleted: true, id: notification._id });
  }),
};
