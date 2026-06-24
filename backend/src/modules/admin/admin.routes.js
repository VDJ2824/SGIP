import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireAdmin } from '../../middleware/roleMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { adminController } from './admin.controller.js';
import {
  activityListSchema,
  assignMentorSchema,
  careerRoleListSchema,
  createCareerRoleSchema,
  createMentorSchema,
  idSchema,
  mentorListSchema,
  mentorUpdateSchema,
  noInputSchema,
  reviewCareerRoleSchema,
  statusSchema,
  studentListSchema,
  updateCareerRoleSchema,
} from './admin.validation.js';

const router = Router();
router.use(authMiddleware, requireAdmin);

router.get('/dashboard', validateRequest(noInputSchema), adminController.dashboard);
router.post('/mentors', validateRequest(createMentorSchema), adminController.createMentor);
router.get('/mentors', validateRequest(mentorListSchema), adminController.listMentors);
router.patch('/mentors/:id/status', validateRequest(statusSchema), adminController.updateMentorStatus);
router.patch('/mentors/:id', validateRequest(mentorUpdateSchema), adminController.updateMentor);

router.get('/students', validateRequest(studentListSchema), adminController.listStudents);
router.get('/students/:id', validateRequest(idSchema), adminController.getStudent);
router.patch('/students/:id/status', validateRequest(statusSchema), adminController.updateStudentStatus);
router.patch('/students/:id/assign-mentor', validateRequest(assignMentorSchema), adminController.assignMentor);

router.get('/career-roles/pending-ai', validateRequest(careerRoleListSchema), adminController.pendingAiRoles);
router.get('/career-roles', validateRequest(careerRoleListSchema), adminController.listCareerRoles);
router.post('/career-roles', validateRequest(createCareerRoleSchema), adminController.createCareerRole);
router.patch('/career-roles/:id/review', validateRequest(reviewCareerRoleSchema), adminController.reviewCareerRole);
router.patch('/career-roles/:id', validateRequest(updateCareerRoleSchema), adminController.updateCareerRole);
router.delete('/career-roles/:id', validateRequest(idSchema), adminController.archiveCareerRole);

router.get('/skill-taxonomy', validateRequest(noInputSchema), adminController.skillTaxonomy);
router.get('/analytics', validateRequest(noInputSchema), adminController.analytics);
router.get('/activity', validateRequest(activityListSchema), adminController.activity);

export default router;
