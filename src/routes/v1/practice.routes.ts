import { Router } from 'express';
import { practiceController } from '../../controllers/practice.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { startSessionSchema, submitBatchAnswersSchema, logAntiCheatEventsSchema } from '../../validators/practice.validator';
import { protect } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const practiceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10000, // Temporarily increased for load testing (was 20)
  message: { success: false, message: 'Too many practice requests, please try again later.' },
  keyGenerator: (req) => {
    return (req as any).user?.id ?? ipKeyGenerator(req.ip || '127.0.0.1');
  }
});

const router = Router();

router.use(protect); // All practice routes require auth

/**
 * @swagger
 * /api/v1/practice-sessions:
 *   post:
 *     summary: Start a new practice session
 *     tags: [Practice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *             properties:
 *               courseId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Practice session created
 */
router.post('/start', /*practiceLimiter,*/ validateRequest(startSessionSchema), asyncHandler(practiceController.startSession));

router.get('/:id', asyncHandler(practiceController.getSession));

/**
 * @swagger
 * /api/v1/practice-sessions/{id}/anticheat-event:
 *   post:
 *     summary: Log anti-cheat events for a session
 *     tags: [Practice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               events:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Events logged
 */
router.post('/:id/anticheat-event', validateRequest(logAntiCheatEventsSchema), asyncHandler(practiceController.logAntiCheatEvents));

router.post('/:id/submit-batch', /*practiceLimiter,*/ validateRequest(submitBatchAnswersSchema), asyncHandler(practiceController.submitBatchAnswers));
router.post('/:id/retry', asyncHandler(practiceController.retrySession));
router.post('/:id/answers/:answerId/explain', practiceLimiter, asyncHandler(practiceController.requestExplanation));
router.get('/', asyncHandler(practiceController.listSessions));

export const practiceRoutes = router;
