import { streakService } from './streak.service';
import { achievementService } from './achievement.service';
import { masteryService } from './mastery.service';
import { leaderboardService } from './leaderboard.service';
import { practiceRepository } from '../repositories/practice.repository';

export class DashboardService {
  async getStudentDashboard(studentId: string) {
    const [streak, achievements, mastery, recentSessions] = await Promise.all([
      streakService.getCurrentStreak(studentId),
      achievementService.getStudentAchievements(studentId),
      masteryService.getStudentMastery(studentId),
      practiceRepository.findRecentCompletedSessions(studentId, 5),
    ]);

    // Compute stats
    const uniqueCourses = new Set<string>();
    let totalElo = 0;
    let totalTopicsMastered = 0;

    mastery.forEach((record) => {
      uniqueCourses.add(record.courseId._id.toString());
      totalElo += record.eloRating;
      // In EduAdapt, mastery is defined as achieving a high masteryScore combined with a high ELO.
      // Currently, the domain rule specifies ELO >= 1200 as a working threshold for the MVP, 
      // but ideally this should be a persisted boolean `isMastered` on MasteryRecord based on AdaptiveEngine calculations.
      if (record.eloRating >= 1200) { 
        totalTopicsMastered++;
      }
    });

    const averageElo = mastery.length > 0 ? Math.round(totalElo / mastery.length) : 0;

    // Use REAL chronological practice session data instead of faking scores from ELO
    const recentActivity = recentSessions.map(session => {
      // Find the most frequent topic in the session to name it
      const topicCounts: Record<string, number> = {};
      let primaryTopicId = 'Unknown';
      let primaryTopicName = 'General Review';
      
      session.questionsServed.forEach((q: any) => {
        const tId = q.topicId?._id?.toString() || q.topicId?.toString();
        const tName = q.topicId?.name || 'Unknown Topic';
        if (tId) {
          topicCounts[tId] = (topicCounts[tId] || 0) + 1;
          // Keep track of name naively for the largest count
          if (topicCounts[tId] >= Math.max(...Object.values(topicCounts))) {
             primaryTopicName = tName;
          }
        }
      });

      const score = session.score || 0;
      let performanceLevel = "poor";
      if (score >= 80) performanceLevel = "good";
      else if (score >= 50) performanceLevel = "fair";

      return {
        _id: session._id.toString(),
        topicName: primaryTopicName,
        courseName: (session.courseId as any)?.title || 'Unknown Course',
        date: session.endedAt || (session as any).updatedAt,
        score,
        performanceLevel,
      };
    });

    // Chart data is chronological (oldest to newest for the chart)
    const chartData = [...recentActivity].reverse().slice(0, 10).map((a: any, i: number) => ({
      name: i,
      score: a.score,
      topic: a.topicName
    }));
    
    const recentAverage = recentActivity.length > 0
      ? Math.round(recentActivity.reduce((sum, a) => sum + a.score, 0) / recentActivity.length)
      : null;


    // Determine focus areas based on REAL mastery data (lowest ELO scores)
    const focusAreas = [...mastery]
      .sort((a, b) => a.eloRating - b.eloRating)
      .slice(0, 3)
      .map(record => ({
        topicId: record.topicId._id?.toString(),
        topicName: (record.topicId as any).name || 'Unknown Topic',
        courseId: record.courseId._id?.toString(),
        courseName: (record.courseId as any).title || 'Unknown Course',
        elo: record.eloRating
      }));

    const averageEloLevel = averageElo < 1000 ? "Beginner" : averageElo < 1200 ? "Intermediate" : averageElo < 1500 ? "Advanced" : "Expert";

    return {
      streak,
      achievements,
      stats: {
        totalCourses: uniqueCourses.size,
        totalTopicsMastered,
        averageElo,
        averageEloLevel,
        recentActivity,
        focusAreas,
        performanceSummary: {
          averageScore: recentAverage,
          chartData
        }
      }
    };
  }

  async getCourseDashboard(studentId: string, courseId: string) {
    const [mastery, leaderboard] = await Promise.all([
      masteryService.getCourseMastery(studentId, courseId),
      leaderboardService.getCourseLeaderboard(courseId, 5), // Top 5
    ]);

    return {
      mastery,
      leaderboard,
    };
  }
}

export const dashboardService = new DashboardService();
