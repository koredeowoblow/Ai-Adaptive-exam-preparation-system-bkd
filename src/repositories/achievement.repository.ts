import { Achievement, StudentAchievement } from '../models/achievement.model';
import { CreateAchievementDTO } from '../types/achievement.types';

export class AchievementRepository {
  async create(data: CreateAchievementDTO) {
    return Achievement.create(data);
  }

  async findAllDefinitions() {
    return Achievement.find();
  }

  async findByStudent(studentId: string) {
    return StudentAchievement.find({ studentId }).populate('achievementId');
  }

  async unlock(studentId: string, achievementId: string) {
    return StudentAchievement.create({ studentId, achievementId });
  }

  async hasAchievement(studentId: string, achievementId: string) {
    const existing = await StudentAchievement.findOne({ studentId, achievementId });
    return !!existing;
  }
}

export const achievementRepository = new AchievementRepository();
