import { LeaderboardEntry } from '../models/leaderboard.model';

export class LeaderboardRepository {
  async getTopByCourse(courseId: string, limit: number = 10, skip: number = 0) {
    return LeaderboardEntry.find({ courseId })
      .sort({ score: -1 })
      .skip(skip)
      .limit(limit)
      .populate('studentId', 'name');
  }

  async getGlobalTop(limit: number = 10, skip: number = 0) {
    return LeaderboardEntry.find()
      .sort({ score: -1 })
      .skip(skip)
      .limit(limit)
      .populate('studentId', 'name')
      .populate('courseId', 'title code');
  }

  async upsertScore(studentId: string, courseId: string, score: number) {
    return LeaderboardEntry.findOneAndUpdate(
      { studentId, courseId },
      { $inc: { score: score } }, // Increment score
      { new: true, upsert: true }
    );
  }
}

export const leaderboardRepository = new LeaderboardRepository();
