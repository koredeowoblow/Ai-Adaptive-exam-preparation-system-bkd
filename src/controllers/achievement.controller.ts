import { Request, Response } from 'express';
import { achievementService } from '../services/achievement.service';
import { sendResponse } from '../utils/sendResponse';

export class AchievementController {
  getMyAchievements = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    const [myAchievements, allAchievements] = await Promise.all([
      achievementService.getStudentAchievements(studentId),
      achievementService.getAvailableAchievements()
    ]);
    
    const unlockedCount = myAchievements.length;
    const totalCount = allAchievements.length;
    const progressPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
    
    const data = {
      achievements: myAchievements,
      summary: { unlockedCount, totalCount, progressPercentage }
    };
    
    return sendResponse(res, 200, 'Achievements retrieved successfully', data);
  };

  getAllAchievements = async (req: Request, res: Response) => {
    const achievements = await achievementService.getAvailableAchievements();
    return sendResponse(res, 200, 'All achievements retrieved successfully', achievements);
  };
}

export const achievementController = new AchievementController();
