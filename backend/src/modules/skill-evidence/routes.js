import multer from 'multer';
import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { evidenceFileFilter, getEvidenceMaxBytes } from '../../utils/fileValidation.js';
import { skillEvidenceController } from './controller.js';
import {
  createSkillEvidenceSchema,
  reviewSkillEvidenceSchema,
  skillEvidenceIdSchema,
  skillEvidenceListSchema,
} from './validation.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: evidenceFileFilter,
  limits: { fileSize: getEvidenceMaxBytes() },
});

router.use(authMiddleware);

router.post('/', upload.single('file'), validateRequest(createSkillEvidenceSchema), skillEvidenceController.create);
router.get('/my', validateRequest(skillEvidenceListSchema), skillEvidenceController.listMine);
router.get('/skills/my', skillEvidenceController.listSkillsMine);
router.get('/pending', validateRequest(skillEvidenceListSchema), skillEvidenceController.listPending);
router.get('/:id', validateRequest(skillEvidenceIdSchema), skillEvidenceController.getById);
router.patch('/:id/review', validateRequest(reviewSkillEvidenceSchema), skillEvidenceController.review);
router.delete('/:id', validateRequest(skillEvidenceIdSchema), skillEvidenceController.delete);

export default router;
