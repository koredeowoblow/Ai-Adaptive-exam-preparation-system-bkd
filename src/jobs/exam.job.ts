import { Queue, Worker, Job } from 'bullmq';
import { env } from '../config/env';
import IORedis from 'ioredis';
import { practiceRepository } from '../repositories/practice.repository';
import { questionRepository } from '../repositories/question.repository';
import { adaptiveService } from '../services/adaptive.service';
import { practiceService } from '../services/practice.service';
import { aiQueue } from './ai.job';

const isMock = env.REDIS_HOST === 'mock' || env.REDIS_HOST === 'none';

const connection: any = isMock
  ? new (require('ioredis-mock'))()
  : new IORedis({
      host: env.REDIS_HOST,
      port: parseInt(env.REDIS_PORT, 10),
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

export const processExamJob = async (job: Job | any) => {
  const { sessionId, studentId, answers } = job.data;
    
    // 1. Anti-Ghost Job Protection (Redis Deduplication)
    const jobDedupKey = `exam:job:finalize:${sessionId}`;
    // Using simple setnx through ioredis
    const isDuplicateJob = await connection.setnx(jobDedupKey, "1");
    if (!isDuplicateJob) {
      console.log(`[ExamWorker] Ghost job intercepted for session ${sessionId}. Ignored.`);
      return { status: "IGNORED_GHOST_JOB" };
    }
    // Keep key alive for duration of exam window to block duplicates
    await connection.expire(jobDedupKey, 14400);

    try {
      const session = await practiceRepository.findById(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      if (session.status === 'completed' || session.status === 'FAILED') {
         return { status: "ALREADY_FINALIZED" };
      }

      const questionIds = answers.map((a: any) => a.questionId);
      const questions = await questionRepository.findManyByIds(questionIds);
      const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

      const batchAdaptiveAnswers: { topicId: string, questionId: string, isCorrect: boolean }[] = [];
      const aiJobs: any[] = [];
      
      let totalExpectedMinMs = 0;
      let questionsAnsweredCount = session.questionsAnswered || 0;
      let correctAnswersCount = session.correctAnswers || 0;

      for (const ans of answers) {
        const existingAns = session.questionsServed.find((q: any) => q.questionId._id?.toString() === ans.questionId || q.questionId.toString() === ans.questionId);
        if (!existingAns) continue;

        const question = questionMap.get(ans.questionId);
        if (!question) continue;

        const submissionId = existingAns.submissionId;
        const isTheory = question.type === 'THEORY';
        const isCorrect = isTheory ? undefined : question.correctAnswer === ans.selectedAnswer;

        totalExpectedMinMs += isTheory ? 3000 + (question.questionText.length * 15) : 3000;

        const answerData: any = {
          submissionId,
          questionId: question._id,
          topicId: question.topicId._id,
          difficulty: question.eloRating || 1,
          timeTaken: ans.timeTaken,
          answeredAt: new Date(),
        };

        if (isTheory) {
          answerData.writtenAnswer = ans.writtenAnswer;
          answerData.gradingStatus = 'PENDING';
        } else {
          answerData.selectedAnswer = ans.selectedAnswer;
          answerData.correct = isCorrect;
          answerData.gradingStatus = 'GRADED';
        }

        // Update the placeholder
        Object.assign(existingAns, answerData);

        questionsAnsweredCount++;
        if (!isTheory && isCorrect) {
          correctAnswersCount++;
        }

        // Prepare mastery update or AI job
        if (!isTheory) {
          batchAdaptiveAnswers.push({
            topicId: question.topicId._id.toString(),
            questionId: question._id.toString(),
            isCorrect: isCorrect!
          });
        } else {
          aiJobs.push({
            name: 'gradeTheoryAnswer',
            data: {
              practiceSessionId: sessionId,
              submissionId: submissionId,
              questionId: question._id.toString(),
              questionText: question.questionText || '',
              studentId,
              courseId: session.courseId._id ? session.courseId._id.toString() : session.courseId.toString(),
              topicId: question.topicId._id.toString(),
              writtenAnswer: ans.writtenAnswer,
              modelAnswer: question.modelAnswer,
              rubric: question.rubric
            }
          });
        }
      }

      const batchDurationMs = Date.now() - session.startedAt.getTime();
      // Check session duration anomaly for anti-cheat
      if (batchDurationMs < totalExpectedMinMs && questionsAnsweredCount > 0) {
        session.antiCheatEvents.push({
          type: 'FAST_ANSWER',
          timestamp: new Date(),
          metadata: { expectedMinMs: totalExpectedMinMs, actualMs: batchDurationMs, isBatch: true }
        });
        session.trustScore = practiceService.calculateTrustScore(session.antiCheatEvents);
      }

      // Process all objective Elo updates in bulk
      const courseIdStr = session.courseId._id ? session.courseId._id.toString() : session.courseId.toString();
      await adaptiveService.processBatchAnswers(studentId, courseIdStr, batchAdaptiveAnswers);

      // Enqueue all AI jobs for theory questions
      if (aiJobs.length > 0) {
        await aiQueue.addBulk(aiJobs);
      }

      session.questionsAnswered = questionsAnsweredCount;
      session.correctAnswers = correctAnswersCount;

      // Ensure any unanswered questions are marked GRADED and not correct
      for (const q of session.questionsServed) {
        if (!q.selectedAnswer && !q.writtenAnswer && q.gradingStatus === 'PENDING') {
          q.gradingStatus = 'GRADED';
          q.correct = false;
        }
      }

      // Complete the session
      const finalScore = session.totalQuestions > 0 ? (correctAnswersCount / session.totalQuestions) * 100 : 0;
      session.status = 'completed';
      session.endedAt = new Date(); // Could use the earlier endedAt, but this is fine
      session.score = finalScore;

      await session.save();
      
      return { status: "SUCCESS" };
      
    } catch (error) {
      console.error(`[ExamWorker] Failed to process session ${sessionId}:`, error);
      // Update session status to FAILED
      const { PracticeSession } = require('../models/practice.model');
      await PracticeSession.findByIdAndUpdate(sessionId, { status: 'FAILED' });
      throw error;
    }
};

export const examWorker: any = !isMock
  ? new Worker(
      'Exam-Tasks',
      processExamJob,
      { 
        connection,
        concurrency: 5,
      }
    )
  : null;

if (examWorker) {
  examWorker.on('completed', (job: any) => {
    console.log(`[ExamWorker] Job ${job.id} has completed successfully.`);
  });

  examWorker.on('failed', (job: any, err: any) => {
    console.log(`[ExamWorker] Job ${job?.id} has failed with ${err.message}`);
  });
}
