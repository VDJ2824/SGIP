import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { skillController } from './controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { updateSkillLevelSchema } from './validation.js';

const router = Router();

router.use(authMiddleware);
router.get('/my', skillController.listMine);
router.patch('/:id/level', validateRequest(updateSkillLevelSchema), skillController.updateLevel);

export default router;
