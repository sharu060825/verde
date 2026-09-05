import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  updatePreferences,
  changePassword,
} from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/preferences', updatePreferences);
router.put('/password', changePassword);

export default router;
