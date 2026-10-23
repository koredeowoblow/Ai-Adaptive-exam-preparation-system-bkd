import { Router } from 'express';
import { aiController } from '../../controllers/ai.controller';
import { protect } from '../../middlewares/auth.middleware';
import { socraticTutorLimiter } from '../../middlewares/rateLimiter';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Protect the endpoint so only authenticated users can access the AI
router.post('/explain', protect, asyncHandler(aiController.generateExplanation));
router.post('/chat', protect, asyncHandler(aiController.chatWithAI));
router.post('/study-plan', protect, asyncHandler(aiController.generateStudyPlan));
router.post('/tutor-question', protect, socraticTutorLimiter, asyncHandler(aiController.socraticTutorChat));
router.post('/distractor-analysis', protect, asyncHandler(aiController.analyzeDistractor));
router.post('/refine-explanation', protect, asyncHandler(aiController.refineExplanation));

export const aiRoutes = router;
