import { achievementRepository } from '../repositories/achievement.repository';

export class AchievementService {
  async getStudentAchievements(studentId: string) {
    return achievementRepository.findByStudent(studentId);
  }

  async getAvailableAchievements() {
    return achievementRepository.findAllDefinitions();
  }

  // To be called by other services when conditions are met
  async unlockAchievement(studentId: string, achievementId: string) {
    const alreadyUnlocked = await achievementRepository.hasAchievement(studentId, achievementId);
    if (alreadyUnlocked) {
      return null;
    }
    return achievementRepository.unlock(studentId, achievementId);
  }
}

export const achievementService = new AchievementService();
