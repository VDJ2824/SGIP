import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { gapAnalysisController } from './controller.js';
import { gapAnalysisHistorySchema, gapAnalysisIdSchema, runGapAnalysisSchema } from './validation.js';

const router = Router();

router.use(authMiddleware);
router.post('/run', validateRequest(runGapAnalysisSchema), gapAnalysisController.run);
router.get('/latest', gapAnalysisController.latest);
router.get('/history', validateRequest(gapAnalysisHistorySchema), gapAnalysisController.history);
router.get('/:id', validateRequest(gapAnalysisIdSchema), gapAnalysisController.getById);
router.delete('/:id', validateRequest(gapAnalysisIdSchema), gapAnalysisController.archive);

export default router;
