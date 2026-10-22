import { Router } from 'express';
import { integrityController } from '../../controllers/integrity.controller';
import { protect } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Student-facing: log an integrity event (must be authenticated)
router.post('/log', protect, asyncHandler(integrityController.logViolation));

// Admin-facing: inspect violations (restricted to staff/administrators)
router.get('/', protect, authorize('student.read'), asyncHandler(integrityController.listViolations));
router.get('/live-sessions', protect, authorize('student.read'), asyncHandler(integrityController.getLiveSessions));
router.post('/session/:sessionId/warn', protect, authorize('student.update'), asyncHandler(integrityController.sendWarning));
router.post('/session/:sessionId/terminate', protect, authorize('student.update'), asyncHandler(integrityController.terminateSession));
router.get('/session/:sessionId', protect, authorize('student.read'), asyncHandler(integrityController.getSessionViolations));
router.get('/student/:studentId', protect, authorize('student.read'), asyncHandler(integrityController.getStudentViolations));

export const integrityRoutes = router;
