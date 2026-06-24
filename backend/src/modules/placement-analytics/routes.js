import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { placementAnalyticsController } from './controller.js';
import { placementAnalyticsQuerySchema } from './validation.js';

const router = Router();

router.get('/overview', validateRequest(placementAnalyticsQuerySchema), placementAnalyticsController.getOverview);

export default router;
