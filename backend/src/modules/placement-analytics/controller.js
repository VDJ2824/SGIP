import { sendResponse } from '../../common/response.js';
import { asyncHandler } from '../../common/asyncHandler.js';
import { placementAnalyticsService } from './service.js';

export const placementAnalyticsController = {
  getOverview: asyncHandler(async (req, res) => {
    const overview = await placementAnalyticsService.getOverview(req.query.studentId, req.query.roleId);
    return sendResponse(res, req, overview);
  }),
};
