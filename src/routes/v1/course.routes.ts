import { Router } from 'express';
import { courseController } from '../../controllers/course.controller';
import { topicController } from '../../controllers/topic.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { createCourseSchema, updateCourseSchema } from '../../validators/course.validator';
import { asyncHandler } from '../../utils/asyncHandler';

import { protect } from '../../middlewares/auth.middleware';

import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(protect); // Ensure all course routes require authentication

router.post('/', authorize('course.create'), validateRequest(createCourseSchema), asyncHandler(courseController.create));
router.get('/', asyncHandler(courseController.getAll));
router.get('/:id', asyncHandler(courseController.getById));
router.get('/:courseId/topics', asyncHandler(topicController.getByCourse));
router.get('/department/:departmentId', asyncHandler(courseController.getByDepartment));
router.put('/:id', authorize('course.update'), validateRequest(updateCourseSchema), asyncHandler(courseController.update));
router.delete('/:id', authorize('course.delete'), asyncHandler(courseController.delete));

export const courseRoutes = router;
