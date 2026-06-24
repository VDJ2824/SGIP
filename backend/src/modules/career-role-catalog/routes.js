import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { careerRoleCatalogController } from './controller.js';
import {
  careerRoleIdSchema,
  careerRoleListSchema,
  createCareerRoleSchema,
  updateCareerRoleSchema,
} from './validation.js';

const router = Router();

router.post('/', validateRequest(createCareerRoleSchema), careerRoleCatalogController.create);
router.get('/', validateRequest(careerRoleListSchema), careerRoleCatalogController.list);
router.get('/:id', validateRequest(careerRoleIdSchema), careerRoleCatalogController.getById);
router.put('/:id', validateRequest(updateCareerRoleSchema), careerRoleCatalogController.update);
router.delete('/:id', validateRequest(careerRoleIdSchema), careerRoleCatalogController.delete);

export default router;
