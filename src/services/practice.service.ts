import { practiceRepository, SessionQueryOptions } from '../repositories/practice.repository';
import { questionRepository } from '../repositories/question.repository';
import { adaptiveService } from './adaptive.service';
import { AppError } from '../utils/AppError';
import { StartSessionDTO, SubmitBatchAnswersDTO } from '../types/practice.types';
import { studentRepository } from '../repositories/student.repository';
import { courseService } from './course.service';
import { aiQueue } from '../jobs/ai.job';
import { examQueue } from '../jobs/exam.job';
import { getLevelConfig } from '../config/academicLevels';
import { PracticeSession } from '../models/practice.model';
import crypto from 'crypto';

export class PracticeService {
  private inFlightStarts = new Map<string, Promise<any>>();

  async startSession(studentId: string, data: StartSessionDTO, tokenUser: any) {
    const resolvedMode: 'quick' | 'mock' | 'diagnostic' =
      data.mode ||
      (data.totalQuestions && data.totalQuestions >= 40
        ? 'mock'
        : (data.totalQuestions && data.totalQuestions <= 5 ? 'diagnostic' : 'quick'));

    // Allow bypassing in-memory deduplication for rigorous DB-level concurrency verification
    if (process.env.BYPASS_IN_MEMORY_DEDUPE === 'true') {
      return this.executeStartSession(studentId, data, tokenUser, resolvedMode);
    }

    const modeKey = `${resolvedMode}_${data.questionType || 'MIXED'}`;
    const lockKey = `${studentId}:${data.courseId}:${modeKey}`;
    const existing = this.inFlightStarts.get(lockKey);
    if (existing) {
      return existing;
    }

    const startPromise = (async () => {
      try {
        return await this.executeStartSession(studentId, data, tokenUser, resolvedMode);
      } finally {
        this.inFlightStarts.delete(lockKey);
      }
    })();

    this.inFlightStarts.set(lockKey, startPromise);
    return startPromise;
  }

  private async executeStartSession(
    studentId: string,
    data: StartSessionDTO,
    tokenUser: any,
    resolvedMode: 'quick' | 'mock' | 'diagnostic' = 'quick',
  ) {
    const student = await studentRepository.findById(studentId);
    if (!student) throw new AppError('User not found', 404);

    // Verify department constraints (SECURITY check)
    if (tokenUser.type === 'student' || student.roleIds) {
      if (student.departmentId) {
        const course = await courseService.getCourseById(data.courseId);
        const studentDeptId = student.departmentId?._id ? student.departmentId._id.toString() : student.departmentId?.toString();
        const courseDeptId = course?.departmentId?._id ? course.departmentId._id.toString() : course?.departmentId?.toString();
        const isEnrolled = (student.enrolledCourseIds || []).some((id: any) => id.toString() === data.courseId.toString());
        if (course && courseDeptId && courseDeptId !== studentDeptId && !isEnrolled) {
          throw new AppError('Forbidden: Cannot start session for a course outside your department', 403);
        }
      }
    }

    // Check if active session exists for this student, course, AND mode
    let session = await practiceRepository.findActiveSession(studentId, data.courseId, resolvedMode);

    const requestedTotal = data.totalQuestions || 10;
    const questionType = data.questionType ?? 'MIXED';

    if (session) {
      const now = Date.now();
      const startedAtMs = new Date(session.startedAt).getTime();
      const budgetMs = (session.timeBudget ? session.timeBudget + 180 : 3600) * 1000;
      const isExpired = (now - startedAtMs) > budgetMs;
      const isUndersized = (session.totalQuestions < requestedTotal) && (session.questionsAnswered === 0);
      const isTypeMismatched = questionType !== 'MIXED' && session.questionTypeMix !== questionType && (session.questionsAnswered === 0);

      if (isExpired || isUndersized || isTypeMismatched) {
        if (session.questionsAnswered === 0) {
          await practiceRepository.cancelSession(session._id.toString());
        } else {
          await practiceRepository.endSession(session._id.toString(), session.score || 0);
        }
        session = null;
      }
    }

    let clampedMessage: string | undefined;

    if (!session) {
      // Resolve the student's academic level and session caps
      const levelLabel = (student as any).level ?? '100L';
      const levelConfig = getLevelConfig(levelLabel);

      // Clamp total if the request exceeds the level's session cap
      let allowedTotal = Math.min(requestedTotal, levelConfig.totalCap);
      if (allowedTotal < requestedTotal) {
        clampedMessage = `Your ${levelLabel} level allows a maximum of ${levelConfig.totalCap} questions per session. Your session has been adjusted from ${requestedTotal} to ${allowedTotal} questions.`;
      }

      // Resolve MCQ vs theory split based on the chosen questionType
      let theoryCount: number;
      let objectiveCount: number;

      if (questionType === 'THEORY_ONLY') {
        theoryCount = Math.min(allowedTotal, levelConfig.theoryCap);
        objectiveCount = 0;
        if (theoryCount < allowedTotal && !clampedMessage) {
          clampedMessage = `Your ${levelLabel} level allows a maximum of ${levelConfig.theoryCap} theory questions per session.`;
        }
        allowedTotal = theoryCount;
      } else if (questionType === 'OBJECTIVE_ONLY') {
        objectiveCount = allowedTotal;
        theoryCount = 0;
      } else {
        // MIXED: theory is capped at the level's theoryCap, remainder is MCQ.
        // Using Math.min(levelConfig.theoryCap, Math.floor(allowedTotal / 2)) so theory
        // can reach its full cap once the session is large enough, without ever exceeding
        // half the session at smaller sizes (e.g. 10-question quick practice).
        theoryCount = Math.min(levelConfig.theoryCap, Math.floor(allowedTotal / 2));
        objectiveCount = allowedTotal - theoryCount;
      }

      // Build the batch using Elo-optimal selection per type
      const ratings = await adaptiveService.getStudentTopicRatings(studentId, data.courseId);
      if (!ratings || ratings.length === 0) {
        throw new AppError("CRITICAL: No topics found for this course.", 404);
      }

      const priorityTopic = adaptiveService.selectPriorityTopic(ratings);
      const explorationStrategy = adaptiveService.determineExploration();
      const targetRating = adaptiveService.calculateTargetRating(priorityTopic.eloRating, explorationStrategy);

      // Exclude questions already answered in recent sessions to promote variety
      const recentSessions = await practiceRepository.findSessionsByStudentPaginated(studentId, data.courseId, 3);
      const recentExcludedIds: string[] = [];
      const recentExcludedTexts: string[] = [];

      for (const s of recentSessions) {
        if (s.questionsServed && Array.isArray(s.questionsServed)) {
          for (const q of s.questionsServed) {
            const rawQ: any = q.questionId;
            const qId = rawQ?._id || rawQ;
            if (qId) recentExcludedIds.push(qId.toString());
            if (rawQ && typeof rawQ === 'object' && rawQ.questionText) {
              recentExcludedTexts.push(rawQ.questionText);
            }
          }
        }
      }

      const questionsServed: any[] = [];
      const seenQuestionTexts = new Set<string>();
      const seenQuestionIds = new Set<string>();

      let remainingObjectives = objectiveCount;
      let remainingTheory = theoryCount;

      const consumeQuestions = (batch: any[]) => {
        for (const question of batch) {
          if (questionsServed.length >= allowedTotal) break;
          const idStr = question._id.toString();
          const norm = (question.questionText || '').trim().toLowerCase();
          if (!seenQuestionIds.has(idStr) && !seenQuestionTexts.has(norm)) {
            seenQuestionIds.add(idStr);
            seenQuestionTexts.add(norm);

            if (question.type === 'THEORY') {
              remainingTheory = Math.max(0, remainingTheory - 1);
            } else {
              remainingObjectives = Math.max(0, remainingObjectives - 1);
            }

            questionsServed.push({
              submissionId: `batch_${crypto.randomUUID()}`,
              questionId: question._id,
              topicId: question.topicId,
              difficulty: question.eloRating || 1,
              gradingStatus: 'PENDING',
            });
          }
        }
      };

      const fetchFromTopic = async (topicId: string, neededMCQ: number, neededTheory: number) => {
        if (neededMCQ <= 0 && neededTheory <= 0) return [];
        const combinedExcludedIds = Array.from(new Set([...recentExcludedIds, ...seenQuestionIds]));
        const combinedExcludedTexts = Array.from(new Set([...recentExcludedTexts, ...seenQuestionTexts]));

        let batch = await adaptiveService.selectBatchQuestions(
          topicId,
          targetRating,
          combinedExcludedIds,
          neededMCQ,
          neededTheory,
          combinedExcludedTexts,
        );

        if (batch.length < (neededMCQ + neededTheory) && recentExcludedIds.length > 0) {
          batch = await adaptiveService.selectBatchQuestions(
            topicId,
            targetRating,
            Array.from(seenQuestionIds),
            neededMCQ,
            neededTheory,
            Array.from(seenQuestionTexts),
          );
        }

        return batch;
      };

      // 1. Initial attempt from priority topic
      const initialBatch = await fetchFromTopic(priorityTopic.topicId, remainingObjectives, remainingTheory);
      consumeQuestions(initialBatch);

      // 2. If priority topic did not fulfill target, draw unique items from other topics in the course
      if (questionsServed.length < allowedTotal) {
        const otherTopics = ratings.filter((r) => r.topicId !== priorityTopic.topicId);
        for (const otherTopic of otherTopics) {
          if (questionsServed.length >= allowedTotal) break;
          const moreBatch = await fetchFromTopic(otherTopic.topicId, remainingObjectives, remainingTheory);
          consumeQuestions(moreBatch);
        }
      }

      // 3. If mixed quotas have deficits (e.g. out of theory but MCQs exist), fill deficit from any topic
      if (questionsServed.length < allowedTotal) {
        for (const r of ratings) {
          if (questionsServed.length >= allowedTotal) break;
          const deficit = allowedTotal - questionsServed.length;
          const flexBatch = await adaptiveService.selectBatchQuestions(
            r.topicId,
            targetRating,
            Array.from(seenQuestionIds),
            deficit,
            deficit,
            Array.from(seenQuestionTexts),
          );
          consumeQuestions(flexBatch);
        }
      }

      if (questionsServed.length < allowedTotal && questionsServed.length > 0 && !clampedMessage) {
        clampedMessage = `Only ${questionsServed.length} unique questions are currently available for this course. Your session has been prepared with all available unique items.`;
      }

      if (questionsServed.length === 0) {
        throw new AppError("CRITICAL: Exhausted Topic - No questions exist.", 404);
      }

      const timeBudget = questionsServed.length * 60; // 1 minute per question default

      try {
        session = await practiceRepository.createSession(
          studentId,
          data.courseId,
          questionsServed.length,
          questionsServed,
          timeBudget,
          questionType,
          clampedMessage,
          resolvedMode,
        );
      } catch (err: any) {
        if (err.code === 11000) {
          const existingActive = await practiceRepository.findActiveSession(studentId, data.courseId, resolvedMode);
          if (existingActive) {
            session = existingActive;
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
    }

    return {
      session,
      clampedMessage, // Surface to frontend so it can notify the student
      nextQuestion: null // Client holds the full array
    };
  }

  async getSession(sessionId: string, tokenUser: any, page?: number, limit?: number) {
    const sessionDoc = await practiceRepository.findById(sessionId);
    if (!sessionDoc) {
      throw new AppError('Session not found', 404);
    }

    // SECURITY: IDOR ownership check
    const sessionStudentId = (sessionDoc.studentId?._id || sessionDoc.studentId)?.toString();
    const tokenUserId = (tokenUser.id || tokenUser._id)?.toString();

    if (tokenUser.role === 'student' || tokenUser.type === 'student') {
      if (sessionStudentId !== tokenUserId) {
        throw new AppError('Forbidden: Cannot access session belonging to another student', 403);
      }
    }

    const session = sessionDoc.toObject();
    if (tokenUser.role === 'student' || tokenUser.type === 'student') {
      delete (session as any).antiCheatEvents; // Exclude sensitive audit logs from student client response
      if (sessionDoc.status === 'active' || sessionDoc.status === 'PENDING_GRADING') {
        (session.questionsServed || []).forEach((q: any) => {
          if (q.questionId && typeof q.questionId === 'object') {
            delete q.questionId.correctAnswer;
            delete q.questionId.explanation;
            delete q.questionId.modelAnswer;
            delete q.questionId.rubric;
            if (Array.isArray(q.questionId.subParts)) {
              q.questionId.subParts.forEach((sp: any) => {
                delete sp.modelAnswer;
                delete sp.rubric;
              });
            }
          }
        });
      }
    }

    // Explicit state contract: never return 0% for pending/ungraded work
    session.isGradingPending = session.status === 'PENDING_GRADING';
    session.gradingState = session.status;
    if (session.status !== 'completed') {
      session.score = null;
      (session.questionsServed || []).forEach((q: any) => {
        if (q.gradingStatus !== 'GRADED') {
          q.score = null;
          q.correct = null;
        }
      });
    }

    const totalServed = session.questionsServed?.length || 0;
    const questionsSummary = (session.questionsServed || []).map((q: any) => ({
      correct: q.correct,
      type: q.questionId?.type || 'MULTIPLE_CHOICE',
      answered: !!(q.selectedAnswer || q.writtenAnswer)
    }));

    // Apply pagination if provided
    if (page !== undefined && limit !== undefined) {
      const startIndex = page * limit;
      session.questionsServed = (session.questionsServed || []).slice(startIndex, startIndex + limit);
    }

    return {
      session,
      totalServed, // Return total so frontend knows pagination bounds
      questionsSummary, // Return lightweight metadata for UI dot indicators
      nextQuestion: null, // Legacy fallback
    };
  }
  async submitBatchAnswers(studentId: string, sessionId: string, data: SubmitBatchAnswersDTO) {
    const session = await practiceRepository.findById(sessionId);
    const sessionStudentId = (session?.studentId?._id || session?.studentId)?.toString();
    if (!session || sessionStudentId !== studentId.toString()) {
      throw new AppError('Forbidden', 403);
    }
    if (session.status !== 'active') {
      throw new AppError('Active session not found', 404);
    }

    // 1. Timer enforcement (Time Budget)
    const elapsedSeconds = (Date.now() - session.startedAt.getTime()) / 1000;
    if (session.timeBudget && elapsedSeconds > session.timeBudget + 10) {
      // Late submission, but we don't reject it - just mark it.
      session.lateSubmission = true;
    }

    // 2. Mark session as PENDING_GRADING, record questionsAnswered at submit
    session.questionsAnswered = data.answers.length;
    session.status = 'PENDING_GRADING';
    session.endedAt = new Date();

    // Save answers directly onto the session placeholders for the worker to read.
    for (const ans of data.answers) {
      const existingAns = session.questionsServed.find(
        (q: any) => (q.questionId?._id || q.questionId).toString() === ans.questionId
      );
      if (existingAns) {
        existingAns.selectedAnswer = ans.selectedAnswer;
        existingAns.writtenAnswer = ans.writtenAnswer;
        if (ans.subPartAnswers && Array.isArray(ans.subPartAnswers)) {
          existingAns.subPartAnswers = ans.subPartAnswers.map((sp) => ({
            partId: sp.partId,
            label: sp.label,
            writtenAnswer: sp.writtenAnswer,
          }));
        }
        existingAns.timeTaken = ans.timeTaken;
      }
    }

    await session.save();

    await examQueue.add('finalizeExam', {
      sessionId,
      studentId,
      answers: data.answers
    });

    const finalizedSession = await practiceRepository.findById(sessionId);

    return {
      session: finalizedSession || session,
      completed: finalizedSession?.status === 'completed',
      status: finalizedSession?.status || 'PENDING_GRADING'
    };
  }

  async requeueFailedGrading(sessionId: string, studentId?: string) {
    const session = await practiceRepository.findById(sessionId);
    if (!session) throw new AppError('Session not found', 404);

    const sessionStudentId = (session.studentId?._id || session.studentId)?.toString();
    if (studentId && sessionStudentId !== studentId.toString()) {
      throw new AppError('Forbidden', 403);
    }

    // Idempotent: If already completed, do not double finalize or re-grade
    if (session.status === 'completed') {
      return {
        session,
        requeued: false,
        message: 'Session is already completed'
      };
    }

    // Only re-grades PENDING or FAILED items
    const uncompleted = (session.questionsServed || []).filter(
      (q: any) => q.gradingStatus === 'PENDING' || q.gradingStatus === 'FAILED'
    );

    if (uncompleted.length === 0) {
      // If all items are graded but status is still PENDING_GRADING, finalize atomically once
      if (session.status === 'PENDING_GRADING') {
        const correctAnswersCount = session.questionsServed.filter((q: any) => q.correct === true).length;
        const totalQuestions = session.totalQuestions || session.questionsServed.length;
        const finalScore = totalQuestions > 0 ? (correctAnswersCount / totalQuestions) * 100 : 0;
        const finalized = await PracticeSession.findOneAndUpdate(
          { _id: sessionId, status: 'PENDING_GRADING' },
          {
            $set: {
              status: 'completed',
              score: finalScore,
              correctAnswers: correctAnswersCount,
              endedAt: session.endedAt || new Date()
            }
          },
          { returnDocument: 'after' }
        );
        return {
          session: finalized || session,
          requeued: false,
          message: 'All items were already graded; session finalized'
        };
      }
      return { session, requeued: false, message: 'No items require grading' };
    }

    const answers = uncompleted.map((q: any) => ({
      questionId: (q.questionId?._id || q.questionId).toString(),
      selectedAnswer: q.selectedAnswer,
      writtenAnswer: q.writtenAnswer,
      timeTaken: q.timeTaken || 0,
    }));

    session.status = 'PENDING_GRADING';
    await session.save();

    await examQueue.add('finalizeExam', {
      sessionId,
      studentId: sessionStudentId,
      answers,
    });

    const refreshedSession = await practiceRepository.findById(sessionId);
    return {
      session: refreshedSession || session,
      requeued: true,
      uncompletedCount: uncompleted.length
    };
  }

  async retryGrading(studentId: string, sessionId: string) {
    const res = await this.requeueFailedGrading(sessionId, studentId);
    return res.session;
  }

  calculateTrustScore(events: any[]): number {
    let score = 100;
    let tabSwitchCount = 0;
    let rightClickCount = 0;

    for (const event of events) {
      switch (event.type) {
        case 'TAB_SWITCH':
          tabSwitchCount++;
          if (tabSwitchCount * 3 <= 20) {
            score -= 3;
          }
          break;
        case 'PASTE_DETECTED':
          score -= 10;
          break;
        case 'FAST_ANSWER':
          score -= 8;
          break;
        case 'DEVTOOLS_DETECTED':
          score -= 15;
          break;
        case 'RIGHT_CLICK_BLOCKED':
          rightClickCount++;
          if (rightClickCount * 1 <= 5) {
            score -= 1;
          }
          break;
      }
    }

    return Math.max(0, score);
  }

  async logAntiCheatEvents(studentId: string, sessionId: string, events: any[]) {
    const session = await practiceRepository.findById(sessionId);
    const sessionStudentId = (session?.studentId?._id || session?.studentId)?.toString();
    if (!session || sessionStudentId !== studentId.toString()) {
      throw new AppError('Forbidden', 403);
    }

    session.antiCheatEvents.push(...events);
    session.trustScore = this.calculateTrustScore(session.antiCheatEvents);
    await session.save();

    return { trustScore: session.trustScore };
  }

  async requestExplanation(studentId: string, sessionId: string, answerId: string) {
    const session = await practiceRepository.findById(sessionId);
    if (!session) throw new AppError('Session not found', 404);
    const sessionStudentId = (session.studentId?._id || session.studentId)?.toString();
    if (sessionStudentId !== studentId.toString()) throw new AppError('Forbidden', 403);
    if (session.status === 'active') throw new AppError('Cannot request explanation while exam is in progress', 400);

    // IDOR Check: Ensure the answer actually belongs to this exact session (match answer ID or question ID)
    const answer = session.questionsServed.find((q: any) =>
      q._id?.toString() === answerId ||
      q.questionId?._id?.toString() === answerId ||
      q.questionId?.toString() === answerId
    );
    if (!answer) throw new AppError('Answer not found in this session', 404);

    // Duplicate Check: Don't enqueue if already working on it or done
    if (answer.explanationStatus === 'PENDING' || answer.explanationStatus === 'READY') {
      return { status: answer.explanationStatus };
    }

    const questionIdStr = answer.questionId?._id?.toString() || answer.questionId?.toString();
    const question = await questionRepository.findById(questionIdStr);
    if (!question) throw new AppError('Question not found', 404);
    if (question.type !== 'MULTIPLE_CHOICE') throw new AppError('Only MCQ supported for this type of explanation', 400);

    // Update status to prevent race conditions immediately
    await practiceRepository.updateExplanationStatus(sessionId, question._id.toString(), 'PENDING');

    // Enqueue the job
    await aiQueue.add('generateMcqExplanation', {
      sessionId,
      questionId: question._id.toString(),
      questionText: question.questionText,
      selectedOption: answer.selectedAnswer,
      correctOption: question.correctAnswer,
      options: question.options
    });

    return { status: 'PENDING' };
  }

  async listSessions(studentId: string, courseId?: string, limit: number = 10, cursor?: string) {
    return practiceRepository.findSessionsByStudentPaginated(studentId, courseId, limit, cursor);
  }

  async listAllSessions(options: SessionQueryOptions) {
    return practiceRepository.findAllSessions(options);
  }
}
export const practiceService = new PracticeService();
