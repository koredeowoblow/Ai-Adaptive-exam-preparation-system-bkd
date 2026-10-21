import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { errorHandler } from './middlewares/errorHandler';
import { sendResponse } from './utils/sendResponse';
import { v1Routes } from './routes/v1';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const app = express();

// Global Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Not allowed by CORS origin validation'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Serve static uploads if using local fallback
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15-minute window
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
  keyGenerator: (req) => ipKeyGenerator(req.ip || '127.0.0.1'),
  skip: () => process.env.NODE_ENV === 'test',
});
app.use(generalLimiter);

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
