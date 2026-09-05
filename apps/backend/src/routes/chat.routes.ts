import { Router } from 'express';
import { chat, getProactiveInsights } from '../controllers/chat.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', chat);
router.get('/proactive', getProactiveInsights);

export default router;
