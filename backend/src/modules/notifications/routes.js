import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { notificationsController } from './controller.js';
import {
  createNotificationSchema,
  markNotificationReadSchema,
  notificationIdSchema,
  notificationListSchema,
} from './validation.js';

const router = Router();

router.post('/', validateRequest(createNotificationSchema), notificationsController.create);
router.get('/', validateRequest(notificationListSchema), notificationsController.list);
router.get('/:id', validateRequest(notificationIdSchema), notificationsController.getById);
router.patch('/:id/read', validateRequest(markNotificationReadSchema), notificationsController.markRead);
router.delete('/:id', validateRequest(notificationIdSchema), notificationsController.delete);

export default router;
