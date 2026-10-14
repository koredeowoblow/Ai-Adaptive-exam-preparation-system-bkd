import { Router } from 'express';
import { masteryController } from '../../controllers/mastery.controller';
import { protect } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.use(protect);

router.get('/', asyncHandler(masteryController.getStudentMastery));
router.get('/course/:courseId', asyncHandler(masteryController.getCourseMastery));
router.get('/topic/:topicId', asyncHandler(masteryController.getTopicMastery));

export const masteryRoutes = router;
