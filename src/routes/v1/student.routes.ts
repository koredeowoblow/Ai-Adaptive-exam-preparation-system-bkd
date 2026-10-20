import { Router } from 'express';
import { studentController } from '../../controllers/student.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { updateStudentProfileSchema, completeOnboardingSchema, enrollCoursesSchema, promoteStudentSchema } from '../../validators/student.validator';
import { protect } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Routes accessible by authenticated students
router.use(protect); 

/**
 * @swagger
 * /api/v1/students/profile:
 *   get:
 *     summary: Get student profile and statistics
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       404:
 *         description: Student not found
 */
router.get('/profile', asyncHandler(studentController.getProfile));
router.put('/profile', validateRequest(updateStudentProfileSchema), asyncHandler(studentController.updateProfile));
router.post('/promote', validateRequest(promoteStudentSchema), asyncHandler(studentController.promote));
router.post('/onboarding', validateRequest(completeOnboardingSchema), asyncHandler(studentController.completeOnboarding));

/**
 * @swagger
 * /api/v1/students/courses:
 *   get:
 *     summary: Get enrolled courses
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 */
router.get('/courses', asyncHandler(studentController.getEnrolledCourses));

/**
 * @swagger
 * /api/v1/students/courses/{courseId}/enroll:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrolled successfully
 *       400:
 *         description: Already enrolled
 */
router.post('/courses/:courseId/enroll', validateRequest(enrollCoursesSchema), asyncHandler(studentController.enrollCourses));

import { authorize } from '../../middlewares/rbac.middleware';

// Admin routes
router.get('/', authorize('student.read'), asyncHandler(studentController.getAll));
router.get('/:id', authorize('student.read'), asyncHandler(studentController.getStudentById));
router.put('/:id', authorize('student.update'), asyncHandler(studentController.updateStudentByAdmin));
router.delete('/:id', authorize('student.delete'), asyncHandler(studentController.deleteStudent));

export const studentRoutes = router;
