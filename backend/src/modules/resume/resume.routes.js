import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { getResumeMaxBytes, resumeFileFilter } from '../../utils/fileValidation.js';
import { resumeController } from './resume.controller.js';
import { resumeIdSchema, resumeListSchema, reviewResumeSchema } from './resume.validation.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getResumeMaxBytes(), files: 1 },
  fileFilter: resumeFileFilter,
});

router.use(authMiddleware);

router.post('/upload', upload.single('resume'), resumeController.upload);
router.post('/:id/extract-skills', validateRequest(resumeIdSchema), resumeController.extractSkills);
router.patch('/:id/review', validateRequest(reviewResumeSchema), resumeController.review);
router.get('/', validateRequest(resumeListSchema), resumeController.list);
router.get('/:id', validateRequest(resumeIdSchema), resumeController.getById);
router.delete('/:id', validateRequest(resumeIdSchema), resumeController.delete);

export default router;
