import { Router } from 'express';
import { studyPlanController } from '../../controllers/studyPlan.controller';
import { protect } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.use(protect);

router.post('/generate', asyncHandler(studyPlanController.generatePlan));
router.get('/active', asyncHandler(studyPlanController.getActivePlan));
router.get('/history', asyncHandler(studyPlanController.getPlanHistory));
router.get('/:planId', asyncHandler(studyPlanController.getPlanById));
router.put('/:planId/tasks/:taskId', asyncHandler(studyPlanController.updateTask));
router.post('/:planId/weeks/:n/generate', asyncHandler(studyPlanController.generateWeek));
router.post('/:planId/weeks/:n/retry', asyncHandler(studyPlanController.retryWeek));

export const studyPlanRoutes = router;
