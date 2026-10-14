import { Router } from 'express';
import { achievementController } from '../../controllers/achievement.controller';
import { protect } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(protect);

router.get('/', asyncHandler(achievementController.getAllAchievements));
router.get('/me', asyncHandler(achievementController.getMyAchievements));

export const achievementRoutes = router;
