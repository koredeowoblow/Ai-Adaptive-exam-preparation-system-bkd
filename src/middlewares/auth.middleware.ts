import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';
import { authenticatedLimiter } from './rateLimiter';

// Extend Express Request object to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers.cookie) {
      // Parse cookies manually to avoid adding cookie-parser dependency
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.split('=').map(c => c.trim());
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      if (cookies.token) {
        token = cookies.token;
      }
    } else if (req.query && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      
      // Trust the JWT payload strictly for authentication identity
      req.user = {
        id: decoded.id,
        _id: decoded.id,
        type: decoded.type || (decoded.role === 'admin' || decoded.role === 'superAdmin' ? 'admin' : 'student'),
        role: decoded.role,
      };
      
      return authenticatedLimiter(req, res, next);
    } catch (err) {
      console.error('JWT VERIFY ERROR:', err);
      return next(new AppError('Not authorized to access this route', 401));
    }
  } catch (error) {
    next(error);
  }
};
