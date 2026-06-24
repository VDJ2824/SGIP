import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireMentor } from '../../middleware/roleMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { mentorController, withMentorId } from './mentor.controller.js';
import { evidenceReviewSchema, gapReportSchema, historySchema, listSchema, noInputSchema, studentSchema } from './mentor.validation.js';

const router = Router();
router.use(authMiddleware, requireMentor);

router.get('/dashboard', validateRequest(noInputSchema), mentorController.dashboard);
router.get('/students', validateRequest(listSchema), withMentorId(mentorController.students));
router.get('/students/:studentId/gap-reports', validateRequest(studentSchema), mentorController.latestGapReportsByRole);
router.get('/students/:studentId/gap-reports/:reportId', validateRequest(gapReportSchema), mentorController.gapReport);
router.get('/students/:studentId/roadmap', validateRequest(studentSchema), mentorController.roadmap);
router.get('/students/:studentId', validateRequest(studentSchema), mentorController.student);
router.get('/evidence/pending', validateRequest(listSchema), withMentorId(mentorController.pendingEvidence));
router.patch('/evidence/:evidenceId/review', validateRequest(evidenceReviewSchema), mentorController.reviewEvidence);
router.get('/reviews/history', validateRequest(historySchema), withMentorId(mentorController.reviewHistory));

export default router;
