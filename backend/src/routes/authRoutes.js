import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authController } from '../controllers/authController.js';
import {
  authProfileSchema,
  changePasswordSchema,
  loginSchema,
  registerSchema,
  verifyLoginOtpSchema,
  verifyRegisterOtpSchema,
} from '../validation/auth.js';

const router = Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/verify-register-otp', validateRequest(verifyRegisterOtpSchema), authController.verifyRegisterOtp);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/verify-login-otp', validateRequest(verifyLoginOtpSchema), authController.verifyLoginOtp);
router.get('/profile', authMiddleware, validateRequest(authProfileSchema), authController.profile);
router.post('/logout', authMiddleware, validateRequest(authProfileSchema), authController.logout);
router.patch('/change-password', authMiddleware, validateRequest(changePasswordSchema), authController.changePassword);

export default router;
