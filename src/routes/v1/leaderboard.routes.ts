import { Router } from 'express';
import { leaderboardController } from '../../controllers/leaderboard.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Can be public or protected depending on requirements
router.get('/global', asyncHandler(leaderboardController.getGlobalLeaderboard));
router.get('/course/:courseId', asyncHandler(leaderboardController.getCourseLeaderboard));

export const leaderboardRoutes = router;
