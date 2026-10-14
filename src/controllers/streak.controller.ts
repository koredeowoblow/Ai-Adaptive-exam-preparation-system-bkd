import { Request, Response } from 'express';
import { streakService } from '../services/streak.service';
import { sendResponse } from '../utils/sendResponse';

export class StreakController {
  getMyStreak = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    // Usually, you'd record activity on log in or practice completion, not just on get. 
    // We'll just retrieve it here.
    const streak = await streakService.getCurrentStreak(studentId);
    return sendResponse(res, 200, 'Streak retrieved successfully', streak);
  };
}

export const streakController = new StreakController();
