import { Router } from 'express';
import { departmentController } from '../../controllers/department.controller';
import { courseController } from '../../controllers/course.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { createDepartmentSchema, updateDepartmentSchema } from '../../validators/department.validator';
import { asyncHandler } from '../../utils/asyncHandler';

import { protect } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(protect);

router.post('/', authorize('department.create'), validateRequest(createDepartmentSchema), asyncHandler(departmentController.create));
router.get('/', asyncHandler(departmentController.getAll));
router.get('/:id', asyncHandler(departmentController.getById));
router.get('/:departmentId/courses', asyncHandler(courseController.getByDepartment));
router.put('/:id', authorize('department.update'), validateRequest(updateDepartmentSchema), asyncHandler(departmentController.update));
router.delete('/:id', authorize('department.delete'), asyncHandler(departmentController.delete));

export const departmentRoutes = router;
