import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middlewares/errorHandler';
import { sendResponse } from './utils/sendResponse';
import { v1Routes } from './routes/v1';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const app = express();

// Global Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes',
  keyGenerator: (req) => ipKeyGenerator(req.ip || '127.0.0.1'),
});
// app.use(generalLimiter);

// Health Check Route
app.get('/health', (req: Request, res: Response) => {
  sendResponse(res, 200, 'Server is healthy');
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/v1', v1Routes);

// Global Error Handler
app.use(errorHandler);

export default app;
