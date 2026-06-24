import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { sgipController } from './controller.js';
import { sgipAnalyticsQuerySchema, sgipDashboardQuerySchema, sgipReportsQuerySchema } from './validation.js';

const router = Router();

router.get('/dashboard', validateRequest(sgipDashboardQuerySchema), sgipController.dashboard);
router.get('/reports', validateRequest(sgipReportsQuerySchema), sgipController.reports);
router.get('/analytics', validateRequest(sgipAnalyticsQuerySchema), sgipController.analytics);

export default router;
