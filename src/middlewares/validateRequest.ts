import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { AppError } from '../utils/AppError';

export const validateRequest = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error: any) {
      if (error instanceof ZodError || error.name === 'ZodError') {
        const issues = error.issues || error.errors || [];
        const errorMessages = Array.isArray(issues) 
          ? issues.map((issue: any) => ({
              message: `${issue.path ? issue.path.join('.') : 'Field'} is ${issue.message}`,
            }))
          : [{ message: 'Invalid request data' }];
          
        res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: errorMessages,
        });
      } else {
        next(new AppError('Internal Server Error', 500));
      }
    }
  };
};
