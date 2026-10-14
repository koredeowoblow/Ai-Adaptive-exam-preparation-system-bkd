import { streakRepository } from '../repositories/streak.repository';

export class StreakService {
  async getCurrentStreak(studentId: string) {
    let streak = await streakRepository.findByStudent(studentId);
    if (!streak) {
      streak = await streakRepository.create(studentId);
    }
    return streak;
  }

  async recordActivity(studentId: string) {
    const streak = await this.getCurrentStreak(studentId);
    const now = new Date();
    const lastDate = new Date(streak.lastActivityDate);
    
    // Check if yesterday or today
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    let newCurrent = streak.currentStreak;
    let newLongest = streak.longestStreak;

    if (diffDays === 1) {
      // Activity was yesterday, increment streak
      newCurrent += 1;
      newLongest = Math.max(newCurrent, newLongest);
    } else if (diffDays > 1) {
      // Missed a day, reset streak (but today counts as 1)
      newCurrent = 1;
    }
    // If diffDays === 0 (same day), don't change streak

    return streakRepository.update(streak._id.toString(), {
      currentStreak: newCurrent,
      longestStreak: newLongest,
      lastActivityDate: now,
    });
  }
}

export const streakService = new StreakService();
