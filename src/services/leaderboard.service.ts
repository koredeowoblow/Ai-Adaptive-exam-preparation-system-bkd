import { leaderboardRepository } from '../repositories/leaderboard.repository';
import { cacheService } from '../utils/cache';

export class LeaderboardService {
  private readonly CACHE_TTL = 60; // 60 seconds

  async getCourseLeaderboard(courseId: string, limit: number = 10, skip: number = 0) {
    const key = `leaderboard:course:${courseId}:limit:${limit}:skip:${skip}`;
    return cacheService.getOrSetSingleFlight(key, this.CACHE_TTL, async () => {
      return leaderboardRepository.getTopByCourse(courseId, limit, skip);
    });
  }

  async getGlobalLeaderboard(limit: number = 10, skip: number = 0) {
    const key = `leaderboard:global:limit:${limit}:skip:${skip}`;
    return cacheService.getOrSetSingleFlight(key, this.CACHE_TTL, async () => {
      return leaderboardRepository.getGlobalTop(limit, skip);
    });
  }

  async addPoints(studentId: string, courseId: string, points: number) {
    return leaderboardRepository.upsertScore(studentId, courseId, points);
  }
}

export const leaderboardService = new LeaderboardService();
