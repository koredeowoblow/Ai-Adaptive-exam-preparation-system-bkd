import { Router } from 'express';
import { departmentRoutes } from './department.routes';
import { courseRoutes } from './course.routes';
import { topicRoutes } from './topic.routes';
import { questionRoutes } from './question.routes';
import { authRoutes } from './auth.routes';
import { studentRoutes } from './student.routes';
import { masteryRoutes } from './mastery.routes';
import { practiceRoutes } from './practice.routes';
import { streakRoutes } from './streak.routes';
import { achievementRoutes } from './achievement.routes';
import { leaderboardRoutes } from './leaderboard.routes';
import { dashboardRoutes } from './dashboard.routes';
import { analyticsRoutes } from './analytics.routes';
import { integrityRoutes } from './integrity.routes';
import { aiRoutes } from './ai.routes';
import rbacRoutes from './rbac.routes';

const router = Router();

router.use('/departments', departmentRoutes);
router.use('/courses', courseRoutes);
router.use('/topics', topicRoutes);
router.use('/questions', questionRoutes);
router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/mastery', masteryRoutes);
router.use('/practice-sessions', practiceRoutes);
router.use('/streaks', streakRoutes);
router.use('/achievements', achievementRoutes);
router.use('/leaderboards', leaderboardRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/integrity', integrityRoutes);
router.use('/ai', aiRoutes);
router.use('/rbac', rbacRoutes);

export const v1Routes = router;
