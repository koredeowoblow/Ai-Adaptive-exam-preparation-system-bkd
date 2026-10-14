import { Request, Response, NextFunction } from 'express';
import { authorizationService } from '../services/authorization.service';
import { AppError } from '../utils/AppError';

export const authorize = (permissionSlug: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user._id) {
        return next(new AppError('Not authenticated', 401));
      }

      // Fast-path bypass for administrative actors
      if (
        req.user.type === 'admin' ||
        req.user.role === 'admin' ||
        req.user.role === 'superAdmin' ||
        req.user.role === 'superadmin'
      ) {
        return next();
      }

      const hasPerm = await authorizationService.hasPermission(req.user._id.toString(), permissionSlug);
      
      if (!hasPerm) {
        return next(new AppError('Forbidden: Insufficient permissions', 403));
      }

      next();
    } catch (error) {
      // Fail closed
      return next(new AppError('Authorization failed', 403));
    }
  };
};
