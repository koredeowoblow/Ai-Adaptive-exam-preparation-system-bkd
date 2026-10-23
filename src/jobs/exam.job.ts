import { Queue, Worker, Job } from 'bullmq';
import { env } from '../config/env';
import IORedis from 'ioredis';
import { practiceRepository } from '../repositories/practice.repository';
import { questionRepository } from '../repositories/question.repository';
import { adaptiveService } from '../services/adaptive.service';
import { practiceService } from '../services/practice.service';
import { groqProvider } from '../providers/groq.provider';
import { PracticeSession } from '../models/practice.model';

const isMock = env.REDIS_HOST === 'mock' || env.REDIS_HOST === 'none';

const connection: any = isMock
  ? new (require('ioredis-mock'))()
  : env.REDIS_URL
  ? new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      retryStrategy: (times: number) => Math.min(times * 100, 3000),
    })
  : new IORedis({
      host: env.REDIS_HOST,
      port: parseInt(env.REDIS_PORT, 10),
      password: env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      retryStrategy: (times: number) => Math.min(times * 100, 3000),
    });

export const examConnection = connection;

export const examQueue: any = isMock
  ? {
      add: async (_name: string, data: any) => {
        return processExamJob({ data });
      },
    }
  : new Queue('Exam-Tasks', { connection });

export const withTimeout = <T>(promise: Promise<T>, ms: number = 30000): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise,
  ]);
};

export async function gradeTheoryWithRetry<T = { score: number; feedback: string }>(
  gradeFn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 500,
  timeoutMs: number = 30000
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await withTimeout(gradeFn(), timeoutMs);
    } catch (err: any) {
      lastError = err;
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

export async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let currentIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      try {
        const val = await fn(items[index], index);
        results[index] = { status: 'fulfilled', value: val };
      } catch (err) {
        results[index] = { status: 'rejected', reason: err };
      }
    }
  });

  await Promise.allSettled(workers);
  return results;
}

export const processExamJob = async (job: Job | any) => {
  const { sessionId, studentId, answers } = job.data;

  // 1. Anti-Ghost Job Protection (Redis Deduplication)
  const jobDedupKey = `exam:job:finalize:${sessionId}`;
  const isDuplicateJob = await connection.setnx(jobDedupKey, '1');
  if (!isDuplicateJob) {
    console.log(`[ExamWorker] Ghost job intercepted for session ${sessionId}. Ignored.`);
    return { status: 'IGNORED_GHOST_JOB' };
  }
  // Keep key alive for duration of exam window to block duplicates
  await connection.expire(jobDedupKey, 14400);

  let sessionFinalized = false;

  try {
    const session = await practiceRepository.findById(sessionId);
    if (!session) {
      await connection.del(jobDedupKey);
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.status === 'completed') {
      sessionFinalized = true;
      return { status: 'ALREADY_FINALIZED' };
    }

    const questionIds = (answers || []).map((a: any) => a.questionId);
    const questions = await questionRepository.findManyByIds(questionIds);
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    const batchAdaptiveAnswers: { topicId: string; questionId: string; isCorrect: boolean }[] = [];
    let totalExpectedMinMs = 0;

    for (const ans of (answers || [])) {
      const existingAns = session.questionsServed.find(
        (q: any) =>
          q.questionId?._id?.toString() === ans.questionId ||
          q.questionId?.toString() === ans.questionId
      );
      if (!existingAns) continue;

      const question = questionMap.get(ans.questionId);
      if (!question) continue;

      const isTheory = question.type === 'THEORY';
      totalExpectedMinMs += isTheory ? 3000 + (question.questionText?.length || 0) * 15 : 3000;

      const questionTopicId = question.topicId?._id || question.topicId;
      const topicIdStr = questionTopicId ? questionTopicId.toString() : '';

      existingAns.timeTaken = ans.timeTaken;
      existingAns.answeredAt = new Date();

      if (isTheory) {
        existingAns.writtenAnswer = ans.writtenAnswer;
        if (ans.subPartAnswers && Array.isArray(ans.subPartAnswers)) {
          existingAns.subPartAnswers = ans.subPartAnswers;
        }
        if (existingAns.gradingStatus !== 'GRADED') {
          existingAns.gradingStatus = 'PENDING';
        }
      } else {
        const isCorrect = question.correctAnswer === ans.selectedAnswer;
        existingAns.selectedAnswer = ans.selectedAnswer;
        existingAns.correct = isCorrect;
        existingAns.gradingStatus = 'GRADED';

        batchAdaptiveAnswers.push({
          topicId: topicIdStr,
          questionId: question._id.toString(),
          isCorrect,
        });
      }
    }

    // Process all objective Elo updates in bulk
    const courseIdStr = (session.courseId?._id || session.courseId)?.toString() || '';
    if (batchAdaptiveAnswers.length > 0) {
      await adaptiveService.processBatchAnswers(studentId, courseIdStr, batchAdaptiveAnswers);
    }

    // Check session duration anomaly for anti-cheat
    const batchDurationMs = Date.now() - session.startedAt.getTime();
    if (batchDurationMs < totalExpectedMinMs && (session.questionsAnswered || 0) > 0) {
      session.antiCheatEvents.push({
        type: 'FAST_ANSWER',
        timestamp: new Date(),
        metadata: { expectedMinMs: totalExpectedMinMs, actualMs: batchDurationMs, isBatch: true },
      });
      session.trustScore = practiceService.calculateTrustScore(session.antiCheatEvents);
    }

    // Ensure any unanswered questions are marked GRADED and not correct
    for (const q of session.questionsServed) {
      const hasSubPartAnswers = Array.isArray(q.subPartAnswers) && q.subPartAnswers.some((sp: any) => sp.writtenAnswer?.trim().length > 0);
      if (!q.selectedAnswer && !q.writtenAnswer && !hasSubPartAnswers && q.gradingStatus === 'PENDING') {
        q.gradingStatus = 'GRADED';
        q.correct = false;
        q.score = 0;
      }
    }

    // Query any missing question documents in session.questionsServed to verify theory type
    const missingQuestionIds = session.questionsServed
      .map((q: any) => (q.questionId?._id || q.questionId)?.toString())
      .filter((id: string) => id && !questionMap.has(id));

    if (missingQuestionIds.length > 0) {
      const extraQuestions = await questionRepository.findManyByIds(missingQuestionIds);
      for (const eq of extraQuestions) {
        questionMap.set(eq._id.toString(), eq);
      }
    }

    // Identify theory answers requiring grading: PENDING or FAILED with writtenAnswer or subPartAnswers
    const theoryItemsToGrade = session.questionsServed.filter((q: any) => {
      const qDoc = questionMap.get((q.questionId?._id || q.questionId)?.toString());
      const isTheory = qDoc?.type === 'THEORY';
      const hasSubPartAnswers = Array.isArray(q.subPartAnswers) && q.subPartAnswers.some((sp: any) => sp.writtenAnswer?.trim().length > 0);
      const hasWrittenAnswer = typeof q.writtenAnswer === 'string' && q.writtenAnswer.trim().length > 0;
      return (
        isTheory &&
        (q.gradingStatus === 'PENDING' || q.gradingStatus === 'FAILED') &&
        (hasWrittenAnswer || hasSubPartAnswers)
      );
    });

    if (theoryItemsToGrade.length > 0) {
      await runWithConcurrency(theoryItemsToGrade, 3, async (item: any) => {
        const qDoc = questionMap.get((item.questionId?._id || item.questionId)?.toString());
        const safeQuestionText =
          typeof qDoc?.questionText === 'string' && qDoc.questionText.trim().length > 0
            ? qDoc.questionText.trim()
            : 'Theory Question';

        const isMultiPart = (qDoc?.hasSubParts || (Array.isArray(qDoc?.subParts) && qDoc.subParts.length > 0));

        try {
          if (isMultiPart) {
            const subPartsData = (qDoc.subParts || []).map((sp: any) => {
              const studentSub = (item.subPartAnswers || []).find((s: any) => s.partId === sp.id);
              return {
                partId: sp.id,
                label: sp.label,
                prompt: sp.prompt,
                maxMarks: sp.maxMarks || 1,
                modelAnswer: sp.modelAnswer,
                rubric: sp.rubric || [],
                studentAnswer: studentSub?.writtenAnswer || '',
              };
            });

            const multiResult = await gradeTheoryWithRetry(
              () =>
                groqProvider.gradeMultiPartTheoryAnswer({
                  questionStem: safeQuestionText,
                  diagramCaption: qDoc.diagramCaption,
                  subParts: subPartsData,
                }),
              3,
              500,
              35000
            );

            item.score = multiResult.overallScore;
            item.feedback = multiResult.overallFeedback;
            item.correct = multiResult.overallScore >= 0.7;
            item.subPartAnswers = multiResult.subPartResults.map((sr: any) => ({
              partId: sr.partId,
              label: sr.label,
              writtenAnswer: subPartsData.find((sp: any) => sp.partId === sr.partId)?.studentAnswer || '',
              score: sr.score,
              marksAwarded: sr.marksAwarded,
              maxMarks: sr.maxMarks,
              feedback: sr.feedback,
              rubricCriteriaMet: sr.rubricCriteriaMet,
              correct: sr.score >= 0.7,
            }));
            item.gradingStatus = 'GRADED';
          } else {
            const modelAnswer = qDoc?.modelAnswer || '';
            const rubric = qDoc?.rubric || [];
            const writtenAnswer = item.writtenAnswer || '';

            const result = await gradeTheoryWithRetry(
              () => groqProvider.gradeTheoryAnswer(safeQuestionText, modelAnswer, rubric, writtenAnswer),
              3,
              500,
              30000
            );
            item.score = result.score;
            item.feedback = result.feedback;
            item.correct = result.score >= 0.7;
            item.gradingStatus = 'GRADED';
          }

          try {
            const topicIdStr = (item.topicId?._id || item.topicId)?.toString() || '';
            await adaptiveService.processAnswer(
              studentId,
              courseIdStr,
              topicIdStr,
              (item.questionId?._id || item.questionId).toString(),
              item.correct
            );
          } catch (adaptErr) {
            console.warn(`[ExamWorker] Adaptive update failed for question ${item.questionId}:`, adaptErr);
          }
        } catch (gradeError) {
          console.error(`[ExamWorker] Theory grading failed for question ${item.questionId}:`, gradeError);
          item.gradingStatus = 'FAILED';
          item.score = undefined;
          item.correct = undefined;
        }
      });
    }

    // Save session item states
    await session.save();

    // Check if ALL items in questionsServed are GRADED
    const allGraded = session.questionsServed.every((q: any) => q.gradingStatus === 'GRADED');

    if (!allGraded) {
      // Session stays PENDING_GRADING; release dedup key so requeue can run
      await connection.del(jobDedupKey);
      return {
        status: 'PENDING_GRADING',
        message: 'Grading incomplete; some items failed or remain pending',
      };
    }

    // All items resolved! Finalize once via guarded findOneAndUpdate on status
    const correctAnswersCount = session.questionsServed.filter((q: any) => q.correct === true).length;
    const totalQuestions = session.totalQuestions || session.questionsServed.length;
    const finalScore = totalQuestions > 0 ? (correctAnswersCount / totalQuestions) * 100 : 0;

    const finalTrustScore = practiceService.calculateTrustScore(session.antiCheatEvents || []);

    const finalizedSession = await PracticeSession.findOneAndUpdate(
      { _id: sessionId, status: { $in: ['PENDING_GRADING', 'active'] } },
      {
        $set: {
          status: 'completed',
          score: finalScore,
          trustScore: finalTrustScore,
          correctAnswers: correctAnswersCount,
          questionsServed: session.questionsServed,
          endedAt: session.endedAt || new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (finalizedSession) {
      sessionFinalized = true;
      return { status: 'SUCCESS' };
    } else {
      sessionFinalized = true;
      return { status: 'ALREADY_FINALIZED' };
    }
  } catch (error) {
    console.error(`[ExamWorker] Failed to process session ${sessionId}:`, error);
    await connection.del(jobDedupKey);
    throw error;
  } finally {
    if (!sessionFinalized) {
      await connection.del(jobDedupKey);
    }
  }
};

export const examWorker: any = !isMock
  ? new Worker('Exam-Tasks', processExamJob, {
      connection,
      concurrency: 5,
    })
  : null;

if (examWorker) {
  examWorker.on('completed', (job: any) => {
    console.log(`[ExamWorker] Job ${job.id} has completed successfully.`);
  });

  examWorker.on('failed', (job: any, err: any) => {
    console.log(`[ExamWorker] Job ${job?.id} has failed with ${err.message}`);
  });
}
