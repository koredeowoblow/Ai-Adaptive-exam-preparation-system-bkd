import { Router } from 'express';
import { streakController } from '../../controllers/streak.controller';
import { protect } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.use(protect);
router.get('/', asyncHandler(streakController.getMyStreak));

export const streakRoutes = router;
