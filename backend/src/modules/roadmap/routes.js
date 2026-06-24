import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { roadmapController } from './controller.js';
import {
  generateRoadmapSchema,
  roadmapHistorySchema,
  roadmapIdSchema,
  updateRoadmapTaskSchema,
} from './validation.js';

const router = Router();

router.use(authMiddleware);
router.post('/generate', validateRequest(generateRoadmapSchema), roadmapController.generate);
router.get('/latest', roadmapController.latest);
router.get('/history', validateRequest(roadmapHistorySchema), roadmapController.history);
router.patch('/task/:taskId', validateRequest(updateRoadmapTaskSchema), roadmapController.updateTask);
router.get('/:id/export/pdf', validateRequest(roadmapIdSchema), roadmapController.exportPdf);
router.get('/:id', validateRequest(roadmapIdSchema), roadmapController.getById);

export default router;
