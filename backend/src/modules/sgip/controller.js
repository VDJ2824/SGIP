import { asyncHandler } from '../../common/asyncHandler.js';
import { sendResponse } from '../../common/response.js';
import { sgipService } from './service.js';

export const sgipController = {
  dashboard: asyncHandler(async (req, res) => {
    const dashboard = await sgipService.getDashboard({
      studentId: req.query.studentId,
      roleId: req.query.roleId,
    });
    return sendResponse(res, req, dashboard);
  }),

  reports: asyncHandler(async (req, res) => {
    const reports = await sgipService.listReports({
      studentId: req.query.studentId,
      limit: req.query.limit,
    });
    return sendResponse(res, req, reports);
  }),

  analytics: asyncHandler(async (req, res) => {
    const analytics = await sgipService.getAnalytics({
      studentId: req.query.studentId,
      roleId: req.query.roleId,
    });
    return sendResponse(res, req, analytics);
  }),
};
