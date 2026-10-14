export interface CourseAnalytics {
  courseId: string;
  totalStudents: number;
  averageMastery: number;
  activeSessions: number;
  completedSessions: number;
}

export interface PlatformAnalytics {
  totalUsers: number;
  totalCourses: number;
  totalQuestionsAnswered: number;
}
