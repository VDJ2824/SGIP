import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { studentProfileController } from './controller.js';
import {
  createStudentProfileSchema,
  studentProfileIdSchema,
  studentProfileListSchema,
  studentProfileMeSchema,
  updateStudentProfileSchema,
  updateStudentProfileMeSchema,
} from './validation.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validateRequest(createStudentProfileSchema), studentProfileController.create);
router.get('/', validateRequest(studentProfileListSchema), studentProfileController.list);
router.get('/me', validateRequest(studentProfileMeSchema), studentProfileController.getMe);
router.get('/:id', validateRequest(studentProfileIdSchema), studentProfileController.getById);
router.put('/me', validateRequest(updateStudentProfileMeSchema), studentProfileController.updateMe);
router.put('/:id', validateRequest(updateStudentProfileSchema), studentProfileController.update);
router.delete('/:id', validateRequest(studentProfileIdSchema), studentProfileController.delete);

export default router;
