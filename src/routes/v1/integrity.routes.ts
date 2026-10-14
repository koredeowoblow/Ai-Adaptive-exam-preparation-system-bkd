import { Router } from 'express';
import { integrityController } from '../../controllers/integrity.controller';
import { protect } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Student-facing: log an integrity event (must be authenticated)
router.post('/log', protect, asyncHandler(integrityController.logViolation));

// Admin-facing: inspect violations (caller must be admin — add RBAC middleware here when needed)
router.get('/', protect, asyncHandler(integrityController.listViolations));
router.get('/session/:sessionId', protect, asyncHandler(integrityController.getSessionViolations));
router.get('/student/:studentId', protect, asyncHandler(integrityController.getStudentViolations));

export const integrityRoutes = router;
