import { Request, Response } from 'express';
import { leaderboardService } from '../services/leaderboard.service';
import { sendResponse } from '../utils/sendResponse';

export class LeaderboardController {
  getCourseLeaderboard = async (req: Request, res: Response) => {
    const courseId = req.params.courseId as string;
    let limit = parseInt(req.query.limit as string) || 10;
    if (limit > 100) limit = 100;
    const skip = parseInt(req.query.skip as string) || 0;
    
    const items = await leaderboardService.getCourseLeaderboard(courseId, limit, skip);
    return sendResponse(res, 200, 'Course leaderboard retrieved', { items, limit, skip });
  };

  getGlobalLeaderboard = async (req: Request, res: Response) => {
    let limit = parseInt(req.query.limit as string) || 10;
    if (limit > 100) limit = 100;
    const skip = parseInt(req.query.skip as string) || 0;
    
    const items = await leaderboardService.getGlobalLeaderboard(limit, skip);
    return sendResponse(res, 200, 'Global leaderboard retrieved', { items, limit, skip });
  };
}

export const leaderboardController = new LeaderboardController();
