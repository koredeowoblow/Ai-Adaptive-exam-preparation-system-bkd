import { Router } from 'express';
import { dashboardController } from '../../controllers/dashboard.controller';
import { protect } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.use(protect);

router.get('/', asyncHandler(dashboardController.getStudentDashboard));
router.get('/course/:courseId', asyncHandler(dashboardController.getCourseDashboard));

export const dashboardRoutes = router;
