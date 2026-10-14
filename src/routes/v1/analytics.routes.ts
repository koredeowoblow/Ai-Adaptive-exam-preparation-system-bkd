import { Router } from 'express';
import { analyticsController } from '../../controllers/analytics.controller';
import { protect } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

// Ideally these would be protected by an 'admin' role middleware in the future
router.use(protect);

router.get('/me', asyncHandler(analyticsController.getStudentAnalytics));
router.get('/student/:studentId', authorize('analytics.read.platform'), asyncHandler(analyticsController.getStudentAnalytics));
router.get('/platform', authorize('analytics.read.platform'), asyncHandler(analyticsController.getPlatformStats));
router.get('/course/:courseId', authorize('analytics.read.platform'), asyncHandler(analyticsController.getCourseStats));
router.get('/department/:departmentId', authorize('analytics.read.platform'), asyncHandler(analyticsController.getDepartmentStats));
router.get('/topic/:topicId', authorize('analytics.read.platform'), asyncHandler(analyticsController.getTopicStats));

export const analyticsRoutes = router;
