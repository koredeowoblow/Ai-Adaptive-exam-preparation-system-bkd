import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { sendResponse } from '../utils/sendResponse';

export class AuthController {
  register = async (req: Request, res: Response) => {
    const data = await authService.registerStudent(req.body);
    
    // Set HttpOnly cookie for frontend authentication
    if (typeof res.cookie === 'function') {
      res.cookie('token', data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000 // 1 hour
      });
    }

    return sendResponse(res, 201, 'Student registered successfully', data);
  };

  login = async (req: Request, res: Response) => {
    const data = await authService.login(req.body);
    
    // Set HttpOnly cookie for frontend authentication
    if (typeof res.cookie === 'function') {
      res.cookie('token', data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000 // 1 hour
      });
    }
    
    return sendResponse(res, 200, 'Login successful', data);
  };

  logout = async (req: Request, res: Response) => {
    if (typeof res.cookie === 'function') {
      res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0 // Clear immediately
      });
    }
    return sendResponse(res, 200, 'Logged out successfully');
  };

  me = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user?.id || req.user?._id;
    const userData = await authService.getMe(userId);
    return sendResponse(res, 200, 'User profile retrieved', userData);
  };
}

export const authController = new AuthController();
