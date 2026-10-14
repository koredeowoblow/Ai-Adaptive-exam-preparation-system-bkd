import { Router } from 'express';
import { aiController } from '../../controllers/ai.controller';
import { protect } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Protect the endpoint so only authenticated users can access the AI
router.post('/explain', protect, asyncHandler(aiController.generateExplanation));
router.post('/chat', protect, asyncHandler(aiController.chatWithAI));
router.post('/study-plan', protect, asyncHandler(aiController.generateStudyPlan));

export const aiRoutes = router;
