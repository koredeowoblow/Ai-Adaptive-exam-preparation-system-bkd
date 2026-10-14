import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err.statusCode || 500;
  let message = err.isOperational ? err.message : 'Something went wrong';

  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
    err.isOperational = true;
  }

  if (!err.isOperational) {
    logger.error('Unexpected Error:', err);
  } else {
    logger.warn(`Operational Error: ${message}`, { statusCode });
  }

  return res.status(statusCode).json({ success: false, message });
};
