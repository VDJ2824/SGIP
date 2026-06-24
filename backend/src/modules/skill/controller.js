import { asyncHandler } from '../../common/asyncHandler.js';
import { sendResponse } from '../../common/response.js';
import { skillService } from './service.js';

export const skillController = {
  listMine: asyncHandler(async (req, res) => {
    const items = await skillService.listMine(req.auth.userId);
    return sendResponse(res, req, items);
  }),
  updateLevel: asyncHandler(async (req, res) => {
    const skill = await skillService.updateLevel({
      id: req.params.id,
      userId: req.auth.userId,
      level: req.validated.body.level,
    });
    return sendResponse(res, req, skill);
  }),
};
