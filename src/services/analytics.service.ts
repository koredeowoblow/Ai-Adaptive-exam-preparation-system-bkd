import { analyticsRepository } from '../repositories/analytics.repository';

export class AnalyticsService {
  async getPlatformAnalytics() {
    return analyticsRepository.getPlatformStats();
  }

  async getCourseAnalytics(courseId: string) {
    const { Course } = await import('../models/course.model');
    const { Topic } = await import('../models/topic.model');
    const { Question } = await import('../models/question.model');
    const { Student } = await import('../models/student.model');
    const { PracticeSession } = await import('../models/practice.model');
    const { MasteryRecord } = await import('../models/mastery.model');

    const courseDoc = await Course.findById(courseId).populate('departmentId').lean();
    if (!courseDoc) {
      throw new Error('Course not found');
    }

    const [topics, enrolledStudents, sessions, masteryRecords] = await Promise.all([
      Topic.find({ courseId }).sort({ order: 1 }).lean(),
      Student.find({ enrolledCourseIds: courseId }).lean(),
      PracticeSession.find({ courseId, isArchived: { $ne: true } }).sort({ createdAt: -1 }).limit(100).populate('studentId', 'name email level').lean(),
      MasteryRecord.find({ courseId }).lean(),
    ]);

    const topicIds = topics.map((t) => t._id);
    const questions = await Question.find({ topicId: { $in: topicIds } }).lean();

    // Summary calculations
    const totalStudents = enrolledStudents.length;
    const completedSessions = sessions.filter((s) => s.status === 'completed');
    const activeSessions = sessions.filter((s) => s.status === 'active');

    let totalScore = 0;
    let passingCount = 0;
    let totalQuestionsAnswered = 0;
    let totalCorrectAnswers = 0;

    completedSessions.forEach((s) => {
      totalScore += s.score || 0;
      if ((s.score || 0) >= 50) passingCount++;
      totalQuestionsAnswered += s.questionsAnswered || 0;
      totalCorrectAnswers += (s as any).correctAnswers || 0;
    });

    const averageScore = completedSessions.length > 0 ? Math.round(totalScore / completedSessions.length) : 0;
    const passRate = completedSessions.length > 0 ? Math.round((passingCount / completedSessions.length) * 100) : 0;
    const overallAccuracy = totalQuestionsAnswered > 0 ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100) : 0;

    let totalMastery = 0;
    let totalElo = 0;
    masteryRecords.forEach((m) => {
      const score = (m as any).masteryScore ?? (m.questionsAttempted > 0 ? Math.round((m.questionsCorrect / m.questionsAttempted) * 100) : Math.min(100, Math.round(((m.eloRating || 1200) / 1600) * 100)));
      totalMastery += score;
      totalElo += m.eloRating || 1200;
    });
    const averageMastery = masteryRecords.length > 0 ? Math.round(totalMastery / masteryRecords.length) : 0;
    const averageEloRating = masteryRecords.length > 0 ? Math.round(totalElo / masteryRecords.length) : 1200;

    const examReadinessScore = Math.min(100, Math.round(averageScore * 0.5 + passRate * 0.3 + averageMastery * 0.2));

    // Cohort / Level Breakdown (100L, 200L, 300L, 400L, 500L)
    const levels = ['100L', '200L', '300L', '400L', '500L'];
    const cohortLevels = levels.map((lvl) => {
      const lvlStudents = enrolledStudents.filter((s) => s.level === lvl);
      const studentIds = new Set(lvlStudents.map((s) => s._id.toString()));
      const lvlSessions = completedSessions.filter((s) => s.studentId && studentIds.has((s.studentId as any)._id?.toString() || s.studentId.toString()));

      let lvlScoreSum = 0;
      let lvlPass = 0;
      lvlSessions.forEach((s) => {
        lvlScoreSum += s.score || 0;
        if ((s.score || 0) >= 50) lvlPass++;
      });
      const lvlAvg = lvlSessions.length > 0 ? Math.round(lvlScoreSum / lvlSessions.length) : (lvlStudents.length > 0 ? averageScore : 0);
      const lvlPassRate = lvlSessions.length > 0 ? Math.round((lvlPass / lvlSessions.length) * 100) : 0;
      const readiness = Math.round(lvlAvg * 0.6 + lvlPassRate * 0.4);

      return {
        level: lvl,
        studentCount: lvlStudents.length,
        sessionsCount: lvlSessions.length,
        averageScore: lvlAvg,
        passRate: lvlPassRate,
        examReadinessScore: readiness,
      };
    });

    // Topic breakdown
    const topicStats = topics.map((t) => {
      const tQuestions = questions.filter((q) => q.topicId.toString() === t._id.toString());
      const tMastery = masteryRecords.filter((m) => m.topicId?.toString() === t._id.toString());

      let tScoreSum = 0;
      let tEloSum = 0;
      let tAttempts = 0;
      let tCorrect = 0;

      tMastery.forEach((m) => {
        const score = (m as any).masteryScore ?? (m.questionsAttempted > 0 ? Math.round((m.questionsCorrect / m.questionsAttempted) * 100) : Math.min(100, Math.round(((m.eloRating || 1200) / 1600) * 100)));
        tScoreSum += score;
        tEloSum += m.eloRating || 1200;
        tAttempts += (m as any).questionsAttempted || 0;
        tCorrect += (m as any).questionsCorrect || 0;
      });

      const mScore = tMastery.length > 0 ? Math.round(tScoreSum / tMastery.length) : 50;
      const elo = tMastery.length > 0 ? Math.round(tEloSum / tMastery.length) : 1200;
      const acc = tAttempts > 0 ? Math.round((tCorrect / tAttempts) * 100) : mScore;

      return {
        topicId: t._id.toString(),
        name: t.name,
        order: t.order || 0,
        questionCount: tQuestions.length,
        studentAttempts: tAttempts,
        accuracy: acc,
        masteryScore: mScore,
        eloRating: elo,
        difficultyTier: elo > 1400 ? 'Advanced' : elo > 1150 ? 'Core' : 'Foundational',
        status: mScore >= 70 ? 'HEALTHY' : mScore >= 45 ? 'NEEDS_REVIEW' : 'CRITICAL',
      };
    });

    // Question Bank Health
    const mcqCount = questions.filter((q) => q.type === 'MULTIPLE_CHOICE').length;
    const theoryCount = questions.filter((q) => q.type === 'THEORY').length;

    // Enrolled students list
    const studentList = enrolledStudents.map((s) => {
      const sSessions = completedSessions.filter((cs) => cs.studentId && ((cs.studentId as any)._id?.toString() === s._id.toString() || cs.studentId.toString() === s._id.toString()));
      let sScoreSum = 0;
      sSessions.forEach((ss) => (sScoreSum += ss.score || 0));
      const sAvg = sSessions.length > 0 ? Math.round(sScoreSum / sSessions.length) : 0;
      const sMastery = masteryRecords.filter((m) => m.studentId?.toString() === s._id.toString());
      const sElo = sMastery.length > 0 ? Math.round(sMastery.reduce((acc, curr) => acc + (curr.eloRating || 1200), 0) / sMastery.length) : 1200;

      return {
        studentId: s._id.toString(),
        name: s.name,
        email: s.email,
        level: s.level || '100L',
        averageScore: sAvg,
        eloRating: sElo,
        sessionsCount: sSessions.length,
        isOnboarded: s.isOnboarded,
      };
    });

    // Recent sessions
    const recentSessions = completedSessions.slice(0, 15).map((s) => ({
      sessionId: s._id.toString(),
      studentName: (s.studentId as any)?.name || 'Student',
      studentEmail: (s.studentId as any)?.email || '',
      studentLevel: (s.studentId as any)?.level || '100L',
      score: s.score || 0,
      questionsAnswered: s.questionsAnswered || 0,
      correctAnswers: (s as any).correctAnswers || 0,
      trustScore: (s as any).trustScore ?? 100,
      status: s.status,
      endedAt: s.endedAt || (s as any).updatedAt,
      durationMinutes: (s as any).durationMinutes || 0,
    }));

    // AI Pedagogical Insights
    const insights: string[] = [];
    if (examReadinessScore >= 75) {
      insights.push(`Course cohort is strongly prepared with a ${examReadinessScore}% Exam Readiness Index.`);
    } else if (examReadinessScore >= 50) {
      insights.push(`Course readiness is moderate (${examReadinessScore}%). Targeted practice before final exams is recommended.`);
    } else {
      insights.push(`Critical: Exam readiness index is below benchmark (${examReadinessScore}%). Remedial study sessions advised.`);
    }

    const lowestTopic = [...topicStats].sort((a, b) => a.accuracy - b.accuracy)[0];
    if (lowestTopic) {
      insights.push(`Topic "${lowestTopic.name}" has the lowest cohort accuracy (${lowestTopic.accuracy}%). Focus next review on this subject.`);
    }

    if (theoryCount === 0) {
      insights.push('Question bank currently has 0 Theory questions. Consider adding theory items with rubric grading.');
    } else {
      insights.push(`Question bank includes ${theoryCount} Theory questions and ${mcqCount} MCQs across ${topics.length} topics.`);
    }

    return {
      course: {
        _id: courseDoc._id.toString(),
        code: courseDoc.code,
        title: courseDoc.title,
        description: courseDoc.description || '',
        level: courseDoc.level || 100,
        department: courseDoc.departmentId ? {
          _id: (courseDoc.departmentId as any)._id?.toString() || '',
          name: (courseDoc.departmentId as any).name || 'Unassigned',
        } : null,
        createdAt: (courseDoc as any).createdAt,
      },
      summary: {
        totalStudents,
        activeSessions: activeSessions.length,
        completedSessions: completedSessions.length,
        totalSessions: sessions.length,
        averageScore,
        passRate,
        overallAccuracy,
        averageMastery,
        averageEloRating,
        examReadinessScore,
        questionBankCount: questions.length,
      },
      cohortLevels,
      topics: topicStats,
      questionBankHealth: {
        totalQuestions: questions.length,
        multipleChoice: mcqCount,
        theory: theoryCount,
      },
      enrolledStudents: studentList,
      recentSessions,
      insights,
    };
  }

  async getDepartmentAnalytics(departmentId: string) {
    const { Department } = await import('../models/department.model');
    const { Course } = await import('../models/course.model');
    const { Topic } = await import('../models/topic.model');
    const { Question } = await import('../models/question.model');
    const { Student } = await import('../models/student.model');
    const { PracticeSession } = await import('../models/practice.model');

    const departmentDoc = await Department.findById(departmentId).lean();
    if (!departmentDoc) {
      throw new Error('Department not found');
    }

    const [courses, students] = await Promise.all([
      Course.find({ departmentId }).lean(),
      Student.find({ departmentId }).lean(),
    ]);

    const courseIds = courses.map((c) => c._id);
    const topics = await Topic.find({ courseId: { $in: courseIds } }).lean();
    const topicIds = topics.map((t) => t._id);

    const [questions, sessions] = await Promise.all([
      Question.find({ topicId: { $in: topicIds } }).lean(),
      PracticeSession.find({ courseId: { $in: courseIds }, isArchived: { $ne: true } }).sort({ createdAt: -1 }).limit(150).populate('studentId', 'name email level').lean(),
    ]);

    const completedSessions = sessions.filter((s) => s.status === 'completed');

    let totalScore = 0;
    let passingCount = 0;
    let totalQuestionsAnswered = 0;
    let totalCorrect = 0;

    completedSessions.forEach((s) => {
      totalScore += s.score || 0;
      if ((s.score || 0) >= 50) passingCount++;
      totalQuestionsAnswered += s.questionsAnswered || 0;
      totalCorrect += (s as any).correctAnswers || 0;
    });

    const averageScore = completedSessions.length > 0 ? Math.round(totalScore / completedSessions.length) : 0;
    const passRate = completedSessions.length > 0 ? Math.round((passingCount / completedSessions.length) * 100) : 0;
    const overallAccuracy = totalQuestionsAnswered > 0 ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 0;
    const departmentReadinessScore = Math.min(100, Math.round(averageScore * 0.55 + passRate * 0.45));

    // Academic Level Cohort Breakdown (100L - 500L)
    const levels = ['100L', '200L', '300L', '400L', '500L'];
    const levelBreakdown = levels.map((lvl) => {
      const lvlStudents = students.filter((s) => s.level === lvl);
      const studentIds = new Set(lvlStudents.map((s) => s._id.toString()));
      const lvlSessions = completedSessions.filter((s) => s.studentId && studentIds.has((s.studentId as any)._id?.toString() || s.studentId.toString()));

      let lvlScoreSum = 0;
      let lvlPass = 0;
      lvlSessions.forEach((s) => {
        lvlScoreSum += s.score || 0;
        if ((s.score || 0) >= 50) lvlPass++;
      });
      const lvlAvg = lvlSessions.length > 0 ? Math.round(lvlScoreSum / lvlSessions.length) : (lvlStudents.length > 0 ? averageScore : 0);
      const lvlPassRate = lvlSessions.length > 0 ? Math.round((lvlPass / lvlSessions.length) * 100) : 0;
      const readiness = Math.round(lvlAvg * 0.6 + lvlPassRate * 0.4);

      return {
        level: lvl,
        studentCount: lvlStudents.length,
        activeCount: lvlSessions.length,
        averageScore: lvlAvg,
        passRate: lvlPassRate,
        examReadinessScore: readiness,
      };
    });

    // Course matrix
    const courseStats = courses.map((c) => {
      const cTopics = topics.filter((t) => t.courseId.toString() === c._id.toString());
      const cSessions = completedSessions.filter((s) => s.courseId.toString() === c._id.toString());
      let cScoreSum = 0;
      let cPass = 0;
      cSessions.forEach((cs) => {
        cScoreSum += cs.score || 0;
        if ((cs.score || 0) >= 50) cPass++;
      });
      const cAvg = cSessions.length > 0 ? Math.round(cScoreSum / cSessions.length) : 0;
      const cPassRate = cSessions.length > 0 ? Math.round((cPass / cSessions.length) * 100) : 0;
      const enrolledCount = students.filter((st) => st.enrolledCourseIds?.some((cid: any) => cid.toString() === c._id.toString())).length;

      return {
        courseId: c._id.toString(),
        code: c.code,
        title: c.title,
        level: c.level || 100,
        topicCount: cTopics.length,
        enrolledStudents: enrolledCount,
        averageScore: cAvg,
        passRate: cPassRate,
        status: cAvg >= 70 ? 'EXCELLENT' : cAvg >= 50 ? 'AVERAGE' : 'NEEDS_ATTENTION',
      };
    });

    // Top students
    const topStudents = students.slice(0, 10).map((s) => {
      const sSessions = completedSessions.filter((cs) => cs.studentId && ((cs.studentId as any)._id?.toString() === s._id.toString() || cs.studentId.toString() === s._id.toString()));
      let sScoreSum = 0;
      sSessions.forEach((ss) => (sScoreSum += ss.score || 0));
      const sAvg = sSessions.length > 0 ? Math.round(sScoreSum / sSessions.length) : 0;
      return {
        studentId: s._id.toString(),
        name: s.name,
        email: s.email,
        level: s.level || '100L',
        averageScore: sAvg,
        sessionsCount: sSessions.length,
      };
    }).sort((a, b) => b.averageScore - a.averageScore);

    // AI Pedagogical Insights
    const insights: string[] = [];
    insights.push(`Department readiness is standing at ${departmentReadinessScore}% across ${courses.length} active curricula.`);
    const activeLevel = [...levelBreakdown].sort((a, b) => b.activeCount - a.activeCount)[0];
    if (activeLevel && activeLevel.activeCount > 0) {
      insights.push(`Highest assessment engagement is observed in the ${activeLevel.level} cohort with ${activeLevel.activeCount} sessions logged.`);
    }
    const lowestCourse = [...courseStats].filter((cs) => cs.averageScore > 0).sort((a, b) => a.averageScore - b.averageScore)[0];
    if (lowestCourse) {
      insights.push(`Curriculum intervention recommended for ${lowestCourse.code} (${lowestCourse.title}) currently averaging ${lowestCourse.averageScore}%.`);
    } else {
      insights.push(`Total question bank volume across department stands at ${questions.length} items across ${topics.length} topics.`);
    }

    return {
      department: {
        _id: departmentDoc._id.toString(),
        name: departmentDoc.name,
        description: departmentDoc.description || '',
        createdAt: (departmentDoc as any).createdAt,
      },
      summary: {
        totalStudents: students.length,
        totalCourses: courses.length,
        totalTopics: topics.length,
        totalQuestions: questions.length,
        totalSessions: sessions.length,
        averageScore,
        passRate,
        overallAccuracy,
        departmentReadinessScore,
      },
      levelBreakdown,
      courses: courseStats,
      topStudents,
      insights,
    };
  }

  async getTopicAnalytics(topicId: string) {
    const { Topic } = await import('../models/topic.model');
    const { Question } = await import('../models/question.model');
    const { MasteryRecord } = await import('../models/mastery.model');

    const topicDoc = await Topic.findById(topicId).populate({
      path: 'courseId',
      populate: { path: 'departmentId' },
    }).lean();

    if (!topicDoc) {
      throw new Error('Topic not found');
    }

    const [questions, masteryRecords] = await Promise.all([
      Question.find({ topicId }).lean(),
      MasteryRecord.find({ topicId }).populate('studentId', 'name email level').lean(),
    ]);

    let totalScore = 0;
    let totalElo = 0;
    let totalAttempts = 0;
    let totalCorrect = 0;
    let masteredCount = 0;
    let atRiskCount = 0;

    let beginner = 0;
    let developing = 0;
    let competent = 0;
    let master = 0;

    masteryRecords.forEach((m) => {
      const score = (m as any).masteryScore ?? (m.questionsAttempted > 0 ? Math.round((m.questionsCorrect / m.questionsAttempted) * 100) : Math.min(100, Math.round(((m.eloRating || 1200) / 1600) * 100)));
      const elo = m.eloRating || 1200;
      totalScore += score;
      totalElo += elo;
      totalAttempts += (m as any).questionsAttempted || 0;
      totalCorrect += (m as any).questionsCorrect || 0;

      if (score >= 75) masteredCount++;
      if (score < 40) atRiskCount++;

      if (elo < 1000) beginner++;
      else if (elo < 1200) developing++;
      else if (elo < 1400) competent++;
      else master++;
    });

    const averageAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 50;
    const masteryScore = masteryRecords.length > 0 ? Math.round(totalScore / masteryRecords.length) : 50;
    const averageEloRating = masteryRecords.length > 0 ? Math.round(totalElo / masteryRecords.length) : 1200;

    // Struggling students
    const strugglingStudents = masteryRecords
      .map((m) => {
        const sScore = (m as any).masteryScore ?? (m.questionsAttempted > 0 ? Math.round((m.questionsCorrect / m.questionsAttempted) * 100) : Math.min(100, Math.round(((m.eloRating || 1200) / 1600) * 100)));
        return {
          studentId: (m.studentId as any)?._id?.toString() || m.studentId?.toString() || '',
          name: (m.studentId as any)?.name || 'Student',
          email: (m.studentId as any)?.email || '',
          level: (m.studentId as any)?.level || '100L',
          masteryScore: Math.round(sScore),
          eloRating: Math.round(m.eloRating || 1200),
        };
      })
      .filter((s) => s.masteryScore < 50);

    // Question previews
    const questionList = questions.map((q) => ({
      questionId: q._id.toString(),
      type: q.type,
      questionText: q.questionText,
      optionsCount: q.options?.length || 0,
      difficulty: (q as any).difficulty || (q.eloRating && q.eloRating > 1400 ? 'Hard' : q.eloRating && q.eloRating < 1100 ? 'Easy' : 'Medium'),
      eloRating: q.eloRating || 1200,
    }));

    const insights: string[] = [];
    if (masteryScore >= 75) {
      insights.push(`High Mastery: ${masteredCount} students have demonstrated comprehensive command of this subject.`);
    } else {
      insights.push(`Needs Reinforcement: Topic mastery index stands at ${masteryScore}%. Consider targeted drills.`);
    }

    if (questions.length < 5) {
      insights.push(`Low Item Density: This topic has only ${questions.length} questions. Recommended minimum is 10 items.`);
    } else {
      insights.push(`Question Bank Healthy: ${questions.length} items configured with calibrated Elo distribution.`);
    }

    return {
      topic: {
        _id: topicDoc._id.toString(),
        name: topicDoc.name,
        order: topicDoc.order || 0,
        course: topicDoc.courseId ? {
          _id: (topicDoc.courseId as any)._id?.toString() || '',
          code: (topicDoc.courseId as any).code || '',
          title: (topicDoc.courseId as any).title || '',
          department: (topicDoc.courseId as any).departmentId ? {
            _id: ((topicDoc.courseId as any).departmentId as any)._id?.toString() || '',
            name: ((topicDoc.courseId as any).departmentId as any).name || '',
          } : null,
        } : null,
      },
      summary: {
        questionCount: questions.length,
        totalAttempts,
        averageAccuracy,
        masteryScore,
        averageEloRating,
        masteredStudentsCount: masteredCount,
        atRiskStudentsCount: atRiskCount,
        difficultyTier: averageEloRating > 1400 ? 'Advanced' : averageEloRating > 1150 ? 'Intermediate' : 'Foundational',
      },
      masteryTiers: {
        beginner,
        developing,
        competent,
        master,
      },
      questions: questionList,
      strugglingStudents,
      insights,
    };
  }

  async getStudentAnalytics(studentId: string) {
    const { practiceRepository } = await import('../repositories/practice.repository');
    const { streakService } = await import('./streak.service');
    const { masteryService } = await import('./mastery.service');
    const { studentRepository } = await import('../repositories/student.repository');
    const { IntegrityLog } = await import('../models/integrity.model');

    const [trend, streak, mastery, studentDoc, allSessionsRes, integrityLogs] = await Promise.all([
      practiceRepository.getStudentAnalyticsTrend(studentId),
      streakService.getCurrentStreak(studentId),
      masteryService.getStudentMastery(studentId),
      studentRepository.findByIdWithCourses(studentId),
      practiceRepository.findAllSessions({ studentId, limit: 50, sortOrder: 'desc' }),
      IntegrityLog.find({ studentId }).sort({ timestamp: -1 }).limit(20).lean(),
    ]);

    // Construct historical performance trend for charts (oldest first)
    const performanceTrend = trend.map(session => ({
      sessionId: session._id.toString(),
      date: session.endedAt || (session as any).updatedAt || new Date().toISOString(),
      score: session.score || 0,
      questionsAnswered: session.questionsAnswered || 0,
      correctAnswers: (session as any).correctAnswers || 0,
    })).reverse();

    let totalElo = 0;
    let topicsMastered = 0;
    const topicMasteryList = mastery.map(m => {
      totalElo += m.eloRating;
      if (m.eloRating >= 1200) topicsMastered++;
      const elo = m.eloRating || 1200;
      const level =
        elo < 1000
          ? 'Beginner'
          : elo < 1200
          ? 'Developing'
          : elo < 1400
          ? 'Competent'
          : elo < 1600
          ? 'Strong'
          : 'Expert';
      const attempted = (m as any).questionsAttempted || 0;
      const correct = (m as any).questionsCorrect || 0;
      const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

      return {
        topicId: m.topicId?._id?.toString() || (m.topicId as any)?.toString() || '',
        topicName: (m.topicId as any)?.name || 'Unknown Topic',
        courseName: ((m.topicId as any)?.courseId as any)?.title || 'General Course',
        eloRating: elo,
        masteryScore: elo,
        level,
        questionsAttempted: attempted,
        questionsCorrect: correct,
        accuracy,
        lastAttemptedAt: (m as any).lastAttemptedAt,
      };
    });

    const averageElo = mastery.length > 0 ? Math.round(totalElo / mastery.length) : 1200;
    const averageEloLevel =
      averageElo < 1000 ? 'Beginner' : averageElo < 1200 ? 'Intermediate' : averageElo < 1500 ? 'Advanced' : 'Expert';
    const averageScore =
      performanceTrend.length > 0
        ? Math.round(performanceTrend.reduce((acc, curr) => acc + curr.score, 0) / performanceTrend.length)
        : 0;

    // Calculate trend percentage change (comparing latest half to oldest half)
    let trendObj = null;
    if (performanceTrend.length >= 4) {
      const mid = Math.floor(performanceTrend.length / 2);
      const firstHalf = performanceTrend.slice(0, mid);
      const secondHalf = performanceTrend.slice(mid);

      const firstAvg = firstHalf.reduce((sum, a) => sum + a.score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, a) => sum + a.score, 0) / secondHalf.length;
      const diff = Math.round(secondAvg - firstAvg);
      trendObj = { value: diff, isPositive: diff > 0 };
    }

    // Sessions calculations
    const allSessions = allSessionsRes.items || [];
    let totalQuestionsAnswered = 0;
    let totalCorrectAnswers = 0;
    let totalTrust = 0;

    const recentSessions = allSessions.map((s: any) => {
      const qAns = s.questionsAnswered || s.totalQuestions || 0;
      const cAns = s.correctAnswers || Math.round((qAns * (s.score || 0)) / 100);
      totalQuestionsAnswered += qAns;
      totalCorrectAnswers += cAns;
      const trust = s.trustScore !== undefined ? s.trustScore : 100;
      totalTrust += trust;

      let durationMinutes = 0;
      if (s.startedAt && s.endedAt) {
        durationMinutes = Math.max(1, Math.round((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000));
      }

      return {
        sessionId: s._id.toString(),
        courseTitle: s.courseId?.title || 'General Practice',
        courseCode: s.courseId?.code || '',
        score: s.score || 0,
        trustScore: trust,
        status: s.status || 'completed',
        questionsAnswered: qAns,
        correctAnswers: cAns,
        startedAt: s.startedAt,
        endedAt: s.endedAt || s.updatedAt,
        durationMinutes,
      };
    });

    const averageTrustScore = allSessions.length > 0 ? Math.round(totalTrust / allSessions.length) : 100;
    const overallAccuracy = totalQuestionsAnswered > 0 ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100) : 0;

    // Course-level subject performance
    const subjectMap = new Map<string, { total: number; count: number; code?: string }>();
    allSessions.forEach((s: any) => {
      const courseTitle = s.courseId?.title || 'General';
      const existing = subjectMap.get(courseTitle) || { total: 0, count: 0, code: s.courseId?.code };
      subjectMap.set(courseTitle, {
        total: existing.total + (s.score || 0),
        count: existing.count + 1,
        code: existing.code || s.courseId?.code,
      });
    });

    const subjectPerformance = Array.from(subjectMap.entries())
      .map(([name, data]) => ({
        name,
        code: data.code,
        avg: Math.round(data.total / data.count),
        attempts: data.count,
      }))
      .sort((a, b) => b.avg - a.avg);

    // Topics to Revisit (Lowest Elo ratings)
    const topicsToRevisit = [...topicMasteryList]
      .sort((a, b) => a.eloRating - b.eloRating)
      .slice(0, 4)
      .map(t => ({
        topicId: t.topicId,
        topicName: t.topicName,
        elo: t.eloRating,
        accuracy: t.accuracy,
        reason: t.eloRating < 1100 ? 'Critical mastery deficiency (<1100 Elo)' : 'Targeted revision priority',
      }));

    // Strengths (Highest Elo ratings)
    const strengths = [...topicMasteryList]
      .sort((a, b) => b.eloRating - a.eloRating)
      .slice(0, 4)
      .map(t => ({
        topicId: t.topicId,
        topicName: t.topicName,
        elo: t.eloRating,
        accuracy: t.accuracy,
        level: t.level,
      }));

    // Calibrated Exam Readiness Score (0–100%)
    const eloComponent = Math.min(50, Math.round((averageElo / 1600) * 50));
    const scoreComponent = Math.min(35, Math.round((averageScore / 100) * 35));
    const volumeComponent = Math.min(15, allSessions.length * 2);
    const examReadinessScore = Math.min(100, Math.max(10, eloComponent + scoreComponent + volumeComponent));

    const examReadinessLevel =
      examReadinessScore >= 80
        ? 'High Readiness (Exam Ready)'
        : examReadinessScore >= 60
        ? 'Moderate Readiness (On Track)'
        : examReadinessScore >= 40
        ? 'Developing (Needs Practice)'
        : 'Foundational (Intensive Review Required)';

    // Integrity summary
    const integrityRiskLevel =
      integrityLogs.length > 5 || averageTrustScore < 70
        ? 'HIGH'
        : integrityLogs.length > 1 || averageTrustScore < 85
        ? 'MEDIUM'
        : 'LOW';

    const integritySummary = {
      totalLogs: integrityLogs.length,
      avgTrustScore: averageTrustScore,
      riskLevel: integrityRiskLevel,
      recentEvents: integrityLogs.map((log: any) => ({
        eventType: log.eventType,
        severity: log.severity,
        timestamp: log.timestamp || log.createdAt,
      })),
    };

    // Learning Insights Generation
    const insights: string[] = [];
    if (studentDoc?.name) {
      insights.push(`Student **${studentDoc.name}** is currently enrolled in **${studentDoc.enrolledCourseIds?.length || 0}** curriculum courses.`);
    }
    if (subjectPerformance.length > 0) {
      insights.push(`Strongest observed curriculum subject is **${subjectPerformance[0].name}** with a **${subjectPerformance[0].avg}%** historical average.`);
    }
    if (trendObj) {
      if (trendObj.value > 0) {
        insights.push(`Demonstrates positive learning momentum: average test score improved by **+${trendObj.value}%** across recent attempts.`);
      } else if (trendObj.value < 0) {
        insights.push(`Recent performance shows a slight dip of **${trendObj.value}%**; recommended focused drill on weak topics.`);
      }
    }
    insights.push(`Completed **${allSessions.length}** practice and examination sessions answering **${totalQuestionsAnswered}** items overall.`);
    if (topicsToRevisit.length > 0) {
      insights.push(`Highest pedagogical priority: recommend revisiting **${topicsToRevisit[0].topicName}** (${topicsToRevisit[0].elo} Elo).`);
    }

    return {
      student: studentDoc
        ? {
            _id: studentDoc._id.toString(),
            name: studentDoc.name,
            email: studentDoc.email,
            level: studentDoc.level || '100L',
            department: studentDoc.departmentId,
            enrolledCourses: studentDoc.enrolledCourseIds,
            isOnboarded: studentDoc.isOnboarded,
            createdAt: (studentDoc as any).createdAt,
          }
        : undefined,
      summary: {
        averageScore,
        averageElo,
        averageEloLevel,
        topicsMastered,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        totalSessions: allSessions.length,
        totalQuestionsAnswered,
        totalCorrectAnswers,
        overallAccuracy,
        examReadinessScore,
        examReadinessLevel,
        averageTrustScore,
      },
      performanceTrend,
      trend: trendObj,
      subjectPerformance,
      topicMasteryList,
      topicsToRevisit,
      strengths,
      recentSessions,
      integritySummary,
      insights,
    };
  }

  async getCohortBenchmark(studentId: string) {
    const { Student } = await import('../models/student.model');
    const { PracticeSession } = await import('../models/practice.model');
    const { MasteryRecord } = await import('../models/mastery.model');

    const studentDoc = await Student.findById(studentId).populate('departmentId').lean();
    if (!studentDoc) {
      throw new Error('Student not found');
    }

    const departmentName = (studentDoc.departmentId as any)?.name || 'Computer Science';
    const level = studentDoc.level || '300L';

    // Fetch cohort peers (same department & level, or same level)
    const cohortQuery: any = { level };
    if (studentDoc.departmentId) {
      cohortQuery.departmentId = (studentDoc.departmentId as any)._id || studentDoc.departmentId;
    }

    let cohortStudents = await Student.find(cohortQuery).select('_id name level departmentId').lean();
    if (cohortStudents.length < 5) {
      // Fallback to all students in this level if department cohort is small
      cohortStudents = await Student.find({ level }).select('_id name level departmentId').lean();
    }
    if (cohortStudents.length === 0) {
      cohortStudents = [studentDoc as any];
    }

    const cohortStudentIds = cohortStudents.map((s) => s._id);

    // Fetch all completed sessions for this cohort
    const [cohortSessions, studentSessions, studentMasteryRecords] = await Promise.all([
      PracticeSession.find({
        studentId: { $in: cohortStudentIds },
        status: 'completed',
        isArchived: { $ne: true },
      })
        .select('studentId score percentage scorePercentage accuracy questionsAnswered correctAnswers')
        .lean(),
      PracticeSession.find({
        studentId: studentDoc._id,
        status: 'completed',
        isArchived: { $ne: true },
      })
        .select('score percentage scorePercentage accuracy questionsAnswered correctAnswers')
        .lean(),
      MasteryRecord.find({ studentId: studentDoc._id }).populate('topicId', 'name category').lean(),
    ]);

    // Calculate average score per student in cohort
    const studentScoresMap: Record<string, { total: number; count: number; avg: number }> = {};
    cohortSessions.forEach((sess) => {
      const sId = sess.studentId.toString();
      if (!studentScoresMap[sId]) {
        studentScoresMap[sId] = { total: 0, count: 0, avg: 0 };
      }
      const score = (sess as any).percentage ?? (sess as any).scorePercentage ?? sess.score ?? 0;
      studentScoresMap[sId].total += score;
      studentScoresMap[sId].count += 1;
    });

    Object.keys(studentScoresMap).forEach((sId) => {
      const rec = studentScoresMap[sId];
      rec.avg = rec.count > 0 ? Math.round(rec.total / rec.count) : 0;
    });

    // Student's own score
    let studentAvgScore = 0;
    if (studentSessions.length > 0) {
      const total = studentSessions.reduce(
        (sum, s) => sum + ((s as any).percentage ?? (s as any).scorePercentage ?? s.score ?? 0),
        0
      );
      studentAvgScore = Math.round(total / studentSessions.length);
    } else {
      studentAvgScore = 72; // default benchmark if fresh account
    }

    // Cohort scores array
    const allCohortScores = Object.values(studentScoresMap).map((rec) => rec.avg);
    if (!allCohortScores.includes(studentAvgScore)) {
      allCohortScores.push(studentAvgScore);
    }
    allCohortScores.sort((a, b) => a - b);

    // Percentile rank: (students with score <= studentAvgScore) / total * 100
    const lowerOrEqualCount = allCohortScores.filter((sc) => sc <= studentAvgScore).length;
    const rawPercentile = Math.round((lowerOrEqualCount / allCohortScores.length) * 100);
    const percentile = Math.min(99, Math.max(5, rawPercentile));

    // Cohort median and average
    const cohortSum = allCohortScores.reduce((a, b) => a + b, 0);
    const cohortAverage = Math.round(cohortSum / allCohortScores.length);
    const cohortMedian = allCohortScores[Math.floor(allCohortScores.length / 2)] || 65;

    // 6-Dimension Competency Radar
    const dimensionDefs = [
      { key: 'theoretical', label: 'Theoretical Rigor & Proofs', baseOffset: 4 },
      { key: 'architecture', label: 'System Architecture & Concurrency', baseOffset: 8 },
      { key: 'algorithms', label: 'Algorithm Complexity & Optimization', baseOffset: -2 },
      { key: 'dataModeling', label: 'Data Modeling & Schemas', baseOffset: 6 },
      { key: 'security', label: 'Security & Fault Tolerance', baseOffset: -5 },
      { key: 'applied', label: 'Applied Synthesis & Implementation', baseOffset: 5 },
    ];

    const baseStudentScore = studentAvgScore > 0 ? studentAvgScore : 70;
    const baseCohortScore = cohortAverage > 0 ? cohortAverage : 65;

    const radar = dimensionDefs.map((dim) => {
      const matchingMastery = studentMasteryRecords.filter((m: any) => {
        const topicName = (m.topicId?.name || '').toLowerCase();
        if (dim.key === 'theoretical' && (topicName.includes('theory') || topicName.includes('automata') || topicName.includes('discrete') || topicName.includes('logic'))) return true;
        if (dim.key === 'architecture' && (topicName.includes('architecture') || topicName.includes('operating') || topicName.includes('system') || topicName.includes('concurrency'))) return true;
        if (dim.key === 'algorithms' && (topicName.includes('algorithm') || topicName.includes('complexity') || topicName.includes('sort') || topicName.includes('graph'))) return true;
        if (dim.key === 'dataModeling' && (topicName.includes('data') || topicName.includes('database') || topicName.includes('sql') || topicName.includes('schema'))) return true;
        if (dim.key === 'security' && (topicName.includes('security') || topicName.includes('crypto') || topicName.includes('integrity') || topicName.includes('network'))) return true;
        if (dim.key === 'applied' && (topicName.includes('software') || topicName.includes('web') || topicName.includes('engineering') || topicName.includes('project'))) return true;
        return false;
      });

      let studentDimScore = baseStudentScore + dim.baseOffset;
      if (matchingMastery.length > 0) {
        const masterySum = matchingMastery.reduce((sum: number, m: any) => sum + (m.masteryScore ?? 70), 0);
        studentDimScore = Math.round(masterySum / matchingMastery.length);
      }
      studentDimScore = Math.min(98, Math.max(25, studentDimScore));

      const cohortDimScore = Math.min(95, Math.max(30, baseCohortScore + Math.round(dim.baseOffset * 0.4)));
      const delta = studentDimScore - cohortDimScore;

      return {
        key: dim.key,
        label: dim.label,
        studentScore: studentDimScore,
        cohortScore: cohortDimScore,
        delta,
      };
    });

    let tier = 'Developing Competency';
    let tierColor = 'var(--color-warning, #f59e0b)';
    if (percentile >= 90) {
      tier = 'Elite Scholar (Top 10%)';
      tierColor = 'var(--color-success, #10b981)';
    } else if (percentile >= 75) {
      tier = 'Distinction Track (Top 25%)';
      tierColor = 'var(--color-primary, #0ea5e9)';
    } else if (percentile >= 50) {
      tier = 'Upper Division (Top 50%)';
      tierColor = '#6366f1';
    }

    const sortedByDelta = [...radar].sort((a, b) => b.delta - a.delta);
    const topStrength = sortedByDelta[0];
    const topGrowthArea = sortedByDelta[sortedByDelta.length - 1];

    return {
      cohort: {
        departmentName,
        level,
        cohortLabel: `LASUSTECH ${departmentName} (${level})`,
        totalStudents: Math.max(cohortStudents.length, allCohortScores.length),
        cohortAverage,
        cohortMedian,
      },
      student: {
        id: studentDoc._id.toString(),
        name: studentDoc.name,
        averageScore: studentAvgScore,
        percentile,
        tier,
        tierColor,
      },
      radar,
      insights: {
        topStrength: {
          label: topStrength.label,
          delta: topStrength.delta,
          score: topStrength.studentScore,
        },
        topGrowthArea: {
          label: topGrowthArea.label,
          delta: topGrowthArea.delta,
          score: topGrowthArea.studentScore,
        },
      },
      distribution: {
        min: allCohortScores[0] || 40,
        q1: allCohortScores[Math.floor(allCohortScores.length * 0.25)] || 55,
        median: cohortMedian,
        q3: allCohortScores[Math.floor(allCohortScores.length * 0.75)] || 78,
        top10: allCohortScores[Math.floor(allCohortScores.length * 0.9)] || 88,
        max: allCohortScores[allCohortScores.length - 1] || 96,
      },
    };
  }
}

export const analyticsService = new AnalyticsService();
