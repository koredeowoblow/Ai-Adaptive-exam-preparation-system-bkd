import { Router } from 'express';
import { authController } from '../../controllers/auth.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { loginSchema, registerSchema } from '../../validators/auth.validator';
import { protect } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  keyGenerator: (req) => ipKeyGenerator(req.ip || '127.0.0.1'),
});

const router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new student
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Student registered successfully
 *       400:
 *         description: Validation error or Email already exists
 */
router.post('/register', /*authLimiter,*/ validateRequest(registerSchema), asyncHandler(authController.register));

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login for student
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', /*authLimiter,*/ validateRequest(loginSchema), asyncHandler(authController.login));

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current logged in student profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/me', protect, asyncHandler(authController.me));

export const authRoutes = router;
