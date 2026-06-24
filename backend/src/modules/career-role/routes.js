import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { careerRoleController } from './controller.js';
import {
  careerRoleIdSchema,
  careerRoleListSchema,
  careerRoleSearchSchema,
  createCareerRoleSchema,
  updateCareerRoleSchema,
} from './validation.js';

const router = Router();

router.get('/', validateRequest(careerRoleListSchema), careerRoleController.list);
router.post('/search', validateRequest(careerRoleSearchSchema), careerRoleController.intelligentSearch);
router.post('/', validateRequest(createCareerRoleSchema), careerRoleController.create);
router.get('/:id', validateRequest(careerRoleIdSchema), careerRoleController.getById);
router.put('/:id', validateRequest(updateCareerRoleSchema), careerRoleController.update);
router.delete('/:id', validateRequest(careerRoleIdSchema), careerRoleController.delete);

export default router;

