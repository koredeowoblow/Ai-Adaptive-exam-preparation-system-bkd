import { masteryRepository } from '../repositories/mastery.repository';
import { AppError } from '../utils/AppError';

export class MasteryService {
  async getStudentMastery(studentId: string, limit: number = 20, cursor?: string) {
    return masteryRepository.findAllByStudent(studentId, limit, cursor);
  }

  async getCourseMastery(studentId: string, courseId: string, limit: number = 20, cursor?: string) {
    return masteryRepository.findByStudentAndCourse(studentId, courseId, limit, cursor);
  }

  async getTopicMastery(studentId: string, topicId: string) {
    return masteryRepository.findByStudentAndTopic(studentId, topicId);
  }

  async getOrCreateRecord(studentId: string, courseId: string, topicId: string) {
    return masteryRepository.findOrCreate(studentId, courseId, topicId);
  }

  // Called by AdaptiveEngine to apply updates
  async recordAnswer(studentId: string, courseId: string, topicId: string, newScore: number, newDifficulty: number, isCorrect: boolean) {
    const record = await this.getOrCreateRecord(studentId, courseId, topicId);
    
    return masteryRepository.updateMastery(record._id.toString(), {
      masteryScore: newScore,
      difficultyLevel: newDifficulty,
      questionsAttempted: record.questionsAttempted + 1,
      questionsCorrect: record.questionsCorrect + (isCorrect ? 1 : 0),
      lastAttemptedAt: new Date(),
    });
  }
}

export const masteryService = new MasteryService();
