import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { errorHandler } from './middlewares/errorHandler';
import { sendResponse } from './utils/sendResponse';
import { v1Routes } from './routes/v1';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

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
app.use(express.text({ type: ['text/plain', 'text/*'], limit: '2mb' }));
app.use((req, _res, next) => {
  if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
    try {
      req.body = JSON.parse(req.body);
    } catch {
      // ignore
    }
  }
  next();
});

// Serve static uploads if using local fallback
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Configure trust proxy so express-rate-limit and req.ip accurately resolve client IPs
// behind reverse proxies (Nginx, Docker, Cloudflare, etc.) without logging ERR_ERL_UNSET_TRUST_PROXY.
// Deployment runs an Express cluster behind 1 reverse proxy, so the default is 1.
if (process.env.TRUST_PROXY) {
  const tp = process.env.TRUST_PROXY;
  app.set('trust proxy', tp === 'true' ? true : isNaN(Number(tp)) ? tp : Number(tp));
} else {
  app.set('trust proxy', 1);
}

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
