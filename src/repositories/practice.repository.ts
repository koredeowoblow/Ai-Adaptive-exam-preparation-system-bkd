import { PracticeSession } from '../models/practice.model';
import type { QuestionTypeMix } from '../types/practice.types';

export class PracticeRepository {
  async createSession(
    studentId: string,
    courseId: string,
    totalQuestions: number = 10,
    questionsServed: any[] = [],
    timeBudget?: number,
    questionTypeMix?: string,
    clampedMessage?: string,
  ) {
    return PracticeSession.create({
      studentId,
      courseId,
      totalQuestions,
      questionsServed,
      timeBudget,
      questionTypeMix: (questionTypeMix ?? 'MIXED') as QuestionTypeMix,
      ...(clampedMessage ? { clampedMessage } : {}),
    });
  }

  async findSessionsByStudentPaginated(studentId: string, courseId?: string, limit: number = 10, cursor?: string) {
    const query: any = { studentId };
    if (courseId) query.courseId = courseId;
    if (cursor) query._id = { $lt: cursor };

    return PracticeSession.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .select('_id courseId status score trustScore startedAt endedAt totalQuestions questionsAnswered')
      .populate('courseId', 'title')
      .lean();
  }

  async findById(id: string) {
    return PracticeSession.findById(id)
      .populate('courseId', 'title code')
      .populate('studentId', 'name email level')
      .populate('questionsServed.questionId');
  }

  async findActiveSession(studentId: string, courseId: string) {
    return PracticeSession.findOne({ studentId, courseId, status: 'active' });
  }


  async endSession(sessionId: string, finalScore: number) {
    return PracticeSession.findByIdAndUpdate(
      sessionId,
      {
        status: 'completed',
        endedAt: new Date(),
        score: finalScore,
      },
      { new: true }
    );
  }
  async updateAnswerGrade(sessionId: string, submissionId: string, isCorrect: boolean, score: number, feedback: string) {
    return PracticeSession.findOneAndUpdate(
      {
        _id: sessionId,
        'questionsServed.submissionId': submissionId
      },
      {
        $set: {
          'questionsServed.$.gradingStatus': 'GRADED',
          'questionsServed.$.score': score,
          'questionsServed.$.feedback': feedback,
          'questionsServed.$.correct': isCorrect
        },
        $inc: {
          correctAnswers: isCorrect ? 1 : 0
        }
      },
      { new: true }
    );
  }

  async findRecentCompletedSessions(studentId: string, limit: number = 5) {
    return PracticeSession.find({ studentId, status: 'completed' })
      .sort({ endedAt: -1 })
      .limit(limit)
      .populate('courseId', 'title')
      .populate('questionsServed.topicId', 'name');
  }

  async getStudentAnalyticsTrend(studentId: string) {
    // Return last 20 sessions for trend
    return PracticeSession.find({ studentId, status: 'completed' })
      .sort({ endedAt: -1 })
      .limit(20)
      .select('score endedAt questionsAnswered correctAnswers');
  }

  async updateExplanationStatus(sessionId: string, questionId: string, status: string) {
    return PracticeSession.updateOne(
      { _id: sessionId, 'questionsServed.questionId': questionId },
      { $set: { 'questionsServed.$.explanationStatus': status } }
    );
  }

  async findAllSessions(options: SessionQueryOptions = {}) {
    const {
      courseId,
      studentId,
      status,
      minScore,
      maxScore,
      minTrust,
      maxTrust,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const filter: any = {};
    if (courseId) filter.courseId = courseId;
    if (studentId) filter.studentId = studentId;
    if (status && status !== 'all') filter.status = status;
    if (minScore !== undefined || maxScore !== undefined) {
      filter.score = {};
      if (minScore !== undefined) filter.score.$gte = minScore;
      if (maxScore !== undefined) filter.score.$lte = maxScore;
    }
    if (minTrust !== undefined || maxTrust !== undefined) {
      filter.trustScore = {};
      if (minTrust !== undefined) filter.trustScore.$gte = minTrust;
      if (maxTrust !== undefined) filter.trustScore.$lte = maxTrust;
    }

    const sortFieldMap: Record<string, string> = {
      startedAt: 'startedAt',
      endedAt: 'endedAt',
      score: 'score',
      trustScore: 'trustScore',
      createdAt: 'createdAt',
    };
    const sortField = sortFieldMap[sortBy] || 'createdAt';

    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (Math.max(1, page) - 1) * safeLimit;

    const [total, sessions] = await Promise.all([
      PracticeSession.countDocuments(filter),
      PracticeSession.find(filter)
        .populate('studentId', 'name email level')
        .populate('courseId', 'title code')
        .sort({ [sortField]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
    ]);

    return {
      items: sessions,
      total,
      page: Math.max(1, page),
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }
}

export interface SessionQueryOptions {
  courseId?: string;
  studentId?: string;
  status?: string;
  minScore?: number;
  maxScore?: number;
  minTrust?: number;
  maxTrust?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const practiceRepository = new PracticeRepository();
