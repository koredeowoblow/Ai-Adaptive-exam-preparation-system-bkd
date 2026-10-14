import { Student } from '../models/student.model';
import { Course } from '../models/course.model';
import { PracticeSession } from '../models/practice.model';
import { MasteryRecord } from '../models/mastery.model';

export class AnalyticsRepository {
  async getPlatformStats() {
    const totalUsers = await Student.countDocuments();
    const totalCourses = await Course.countDocuments();
    
    const result = await PracticeSession.aggregate([
      { $group: { _id: null, totalAnswered: { $sum: '$questionsAnswered' } } }
    ]);

    const totalQuestionsAnswered = result[0]?.totalAnswered || 0;

    return { totalUsers, totalCourses, totalQuestionsAnswered };
  }

  async getCourseStats(courseId: string) {
    const totalStudents = await Student.countDocuments({ enrolledCourseIds: courseId });
    
    const sessionStats = await PracticeSession.aggregate([
      { $match: { courseId: courseId /* might need to cast to ObjectId */ } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    let activeSessions = 0;
    let completedSessions = 0;
    sessionStats.forEach(stat => {
      if (stat._id === 'active') activeSessions = stat.count;
      if (stat._id === 'completed') completedSessions = stat.count;
    });

    const masteryStats = await MasteryRecord.aggregate([
      { $match: { courseId: courseId } },
      { $group: { _id: null, avgMastery: { $avg: '$masteryScore' } } }
    ]);

    const averageMastery = masteryStats[0]?.avgMastery || 0;

    return {
      courseId,
      totalStudents,
      averageMastery,
      activeSessions,
      completedSessions,
    };
  }
}

export const analyticsRepository = new AnalyticsRepository();
