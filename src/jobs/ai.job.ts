import { Queue, Worker, Job } from 'bullmq';
import { env } from '../config/env';
import { groqProvider } from '../providers/groq.provider';
import IORedis from 'ioredis';

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

export const aiQueue: any = isMock
  ? {
      add: async (_name: string, _data: any) => {},
    }
  : new Queue('AI-Tasks', { connection });

const withTimeout = <T>(promise: Promise<T>, ms: number = 30000): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`AI operation timed out after ${ms}ms`)), ms);
  });
  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeoutPromise
  ]);
};

export const aiWorker: any = !isMock
  ? new Worker(
  'AI-Tasks',
  async (job: Job) => {
    switch (job.name) {
      case 'generateExplanation': {
        const { questionText, correctAnswer, studentAnswer } = job.data;
        const explanation = await withTimeout(groqProvider.generateExplanation(questionText, correctAnswer, studentAnswer));
        
        // In a real system, you might save this explanation to the PracticeAnswer record
        // or notify the user via WebSockets. For now, we return it as the job result.
        return { explanation };
      }
      case 'generateMcqExplanation': {
        const { sessionId, questionId, questionText, selectedOption, correctOption, options } = job.data;
        try {
          const explanation = await withTimeout(groqProvider.generateMcqExplanation(questionText, correctOption, selectedOption));
          const { PracticeSession } = require('../models/practice.model');
          await PracticeSession.updateOne(
            { _id: sessionId, 'questionsServed.questionId': questionId },
            { $set: { 'questionsServed.$.aiExplanation': explanation, 'questionsServed.$.explanationStatus': 'READY' } }
          );
          return { explanation };
        } catch (error) {
          const { PracticeSession } = require('../models/practice.model');
          await PracticeSession.updateOne(
            { _id: sessionId, 'questionsServed.questionId': questionId },
            { $set: { 'questionsServed.$.explanationStatus': 'FAILED' } }
          );
          throw error;
        }
      }
      case 'generateFocusPlan': {
        const { studentStats } = job.data;
        const plan = await withTimeout(groqProvider.generateFocusPlan(studentStats));
        return { plan };
      }
      case 'gradeTheoryAnswer': {
        const { practiceSessionId, submissionId, questionId, studentId, courseId, topicId, writtenAnswer, modelAnswer, rubric } = job.data;
        let questionText = job.data.questionText;

        // Fetch question text from database if missing from job payload
        if ((!questionText || typeof questionText !== 'string' || !questionText.trim()) && questionId) {
          try {
            const { questionRepository } = require('../repositories/question.repository');
            const questionDoc = await questionRepository.findById(questionId);
            if (questionDoc?.questionText) {
              questionText = questionDoc.questionText;
            }
          } catch (fetchError) {
            console.warn(`[AI Job] Could not fetch questionText for questionId ${questionId}:`, fetchError);
          }
        }

        const safeQuestionText = (typeof questionText === 'string' && questionText.trim().length > 0)
          ? questionText.trim()
          : 'Theory Question';

        // 1. Grade the answer via Groq with a 30s timeout
        const { score, feedback } = await withTimeout(groqProvider.gradeTheoryAnswer(
          safeQuestionText,
          modelAnswer, 
          rubric, 
          writtenAnswer
        ));
        
        // 2. Persist grade
        const isCorrect = score >= 0.7; // Derived boolean signal
        const { practiceRepository } = require('../repositories/practice.repository');
        await practiceRepository.updateAnswerGrade(practiceSessionId, submissionId, isCorrect, score, feedback);

        // 3. Trigger adaptive update
        const { adaptiveService } = require('../services/adaptive.service');
        await adaptiveService.processAnswer(studentId, courseId, topicId, questionId, isCorrect);
        
        return { score, feedback, isCorrect };
      }
      default:
        throw new Error('Unknown job name');
    }
  },
  { 
    connection,
    concurrency: 5, // Process max 5 AI jobs concurrently
    limiter: {
      max: 20, // Max 20 jobs
      duration: 1000 // per 1 second
    }
  }
) : null;

if (aiWorker) {
  aiWorker.on('completed', (job: any) => {
    console.log(`Job ${job.id} has completed! Result:`, job.returnvalue);
  });

  aiWorker.on('failed', (job: any, err: any) => {
    console.log(`Job ${job?.id} has failed with ${err.message}`);
  });
}
