import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { reportsController } from './controller.js';
import { compareSchema, reportIdSchema, reportsQuerySchema, reportTypeSchema } from './validation.js';

const router = Router();
router.use(authMiddleware);

router.get('/', validateRequest(reportsQuerySchema), reportsController.list);
router.get('/profile-summary', validateRequest(reportsQuerySchema), reportsController.get('profile-summary'));
router.get('/resume-analysis', validateRequest(reportsQuerySchema), reportsController.get('resume-analysis'));
router.get('/gap-analysis/latest', validateRequest(reportsQuerySchema), reportsController.get('gap-analysis'));
router.get('/gap-analysis/history', validateRequest(reportsQuerySchema), reportsController.gapHistory);
router.get('/gap-analysis/:id', validateRequest(reportIdSchema), reportsController.gapById);
router.get('/roadmap/latest', validateRequest(reportsQuerySchema), reportsController.get('roadmap'));
router.get('/skill-evidence', validateRequest(reportsQuerySchema), reportsController.get('skill-evidence'));
router.get('/progress', validateRequest(reportsQuerySchema), reportsController.get('progress'));
router.get('/compare', validateRequest(compareSchema), reportsController.compare);
router.get('/:type/export/pdf', validateRequest(reportTypeSchema), reportsController.exportPdf);

export default router;
