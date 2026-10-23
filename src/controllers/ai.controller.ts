import { Request, Response } from 'express';
import { groqProvider } from '../providers/groq.provider';
import { aiService } from '../services/ai.service';
import { sendResponse } from '../utils/sendResponse';
import { validateExamDate } from '../utils/dateValidation';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

let activeTutorGroqCalls = 0;
const TUTOR_CONCURRENCY_KEY = 'ai:tutor:concurrency';
const TUTOR_CONCURRENCY_TTL_SECONDS = 60;

const getTutorConcurrencyCap = (): number => {
  const envVal = process.env.GROQ_TUTOR_CONCURRENCY;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 15;
};

export class AIController {
  /**
   * POST /api/v1/ai/explain
   * Synchronously generates an explanation using Groq LLM.
   */
  generateExplanation = async (req: Request, res: Response) => {
    const { questionText, correctAnswer, studentAnswer } = req.body;
    
    if (!questionText || !correctAnswer || !studentAnswer) {
      return sendResponse(res, 400, 'Missing required fields for explanation generation');
    }

    const explanation = await groqProvider.generateExplanation(questionText, correctAnswer, studentAnswer);
    return sendResponse(res, 200, 'Explanation generated successfully', { explanation });
  };

  chatWithAI = async (req: Request, res: Response) => {
    const { messages, courseId, context: fallbackContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return sendResponse(res, 400, 'Messages array is required');
    }

    const studentId = req.user?.id;
    const reply = await aiService.generateChatResponse(messages, courseId, studentId, fallbackContext);
    
    return sendResponse(res, 200, 'Response generated', { reply });
  };

  generateStudyPlan = async (req: Request, res: Response) => {
    const { studentStats, department, level, nextExamDate } = req.body;

    if (!studentStats) {
      return sendResponse(res, 400, 'Student stats are required to generate a study plan');
    }

    let cleanDate: string | undefined = undefined;
    if (nextExamDate !== undefined && nextExamDate !== null && nextExamDate !== '') {
      const dateCheck = validateExamDate(nextExamDate);
      if (!dateCheck.isValid) {
        return sendResponse(res, 400, dateCheck.error || 'Invalid exam date');
      }
      cleanDate = dateCheck.cleanDate || undefined;
    }

    const rawPlan = await groqProvider.generateStudyPlan(studentStats, department, level, cleanDate);
    let plan;
    try {
      plan = JSON.parse(rawPlan);
    } catch {
      plan = { raw: rawPlan };
    }
    return sendResponse(res, 200, 'Study plan generated', { plan });
  };

  /**
   * POST /api/v1/ai/tutor-question
   * Socratic interactive chat focused on a specific completed question.
   * Capped with cross-instance Redis concurrency counter (default 15) and 1 short retry on 429/timeout.
   */
  socraticTutorChat = async (req: Request, res: Response) => {
    const { questionContext, messages } = req.body;

    if (!questionContext || !questionContext.questionText) {
      return sendResponse(res, 400, 'questionContext with questionText is required');
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return sendResponse(res, 400, 'messages array is required');
    }

    const maxConcurrency = getTutorConcurrencyCap();
    let acquiredRedis = false;
    let acquiredMemory = false;

    try {
      if (redisClient) {
        const count = await redisClient.incr(TUTOR_CONCURRENCY_KEY);
        acquiredRedis = true;
        if (count === 1) {
          await redisClient.expire(TUTOR_CONCURRENCY_KEY, TUTOR_CONCURRENCY_TTL_SECONDS);
        }
        if (count > maxConcurrency) {
          await redisClient.decr(TUTOR_CONCURRENCY_KEY).catch(() => {});
          acquiredRedis = false;
          return sendResponse(res, 429, 'Tutor is busy, try again in a moment');
        }
      } else {
        if (activeTutorGroqCalls >= maxConcurrency) {
          return sendResponse(res, 429, 'Tutor is busy, try again in a moment');
        }
        activeTutorGroqCalls++;
        acquiredMemory = true;
      }
    } catch (redisErr) {
      logger.warn('[AIController] Redis concurrency check error, falling back to in-memory counter:', redisErr);
      if (activeTutorGroqCalls >= maxConcurrency) {
        return sendResponse(res, 429, 'Tutor is busy, try again in a moment');
      }
      activeTutorGroqCalls++;
      acquiredMemory = true;
    }

    try {
      const executeWithRetry = async () => {
        try {
          return await groqProvider.generateSocraticTutorResponse(questionContext, messages);
        } catch (err: any) {
          const is429 =
            err?.status === 429 ||
            err?.statusCode === 429 ||
            (typeof err?.message === 'string' &&
              (err.message.includes('429') || err.message.toLowerCase().includes('rate_limit_exceeded')));
          const isTimeout =
            err?.name === 'TimeoutError' ||
            err?.code === 'ETIMEDOUT' ||
            (typeof err?.message === 'string' && err.message.toLowerCase().includes('timeout'));

          if (is429 || isTimeout) {
            // One short retry after 750ms backoff
            await new Promise((resolve) => setTimeout(resolve, 750));
            return await groqProvider.generateSocraticTutorResponse(questionContext, messages);
          }
          throw err;
        }
      };

      const reply = await executeWithRetry();
      return sendResponse(res, 200, 'Socratic tutor response generated', { reply });
    } catch (error: any) {
      const is429 =
        error?.status === 429 ||
        error?.statusCode === 429 ||
        (typeof error?.message === 'string' &&
          (error.message.includes('429') || error.message.toLowerCase().includes('rate_limit_exceeded')));
      const isTimeout =
        error?.name === 'TimeoutError' ||
        error?.code === 'ETIMEDOUT' ||
        (typeof error?.message === 'string' && error.message.toLowerCase().includes('timeout'));

      if (is429) {
        return sendResponse(res, 429, 'Tutor is busy, try again in a moment');
      }
      if (isTimeout) {
        return sendResponse(res, 504, 'Tutor is busy, try again in a moment');
      }

      throw error;
    } finally {
      if (acquiredRedis) {
        try {
          const remaining = await redisClient.decr(TUTOR_CONCURRENCY_KEY);
          if (remaining <= 0) {
            await redisClient.del(TUTOR_CONCURRENCY_KEY).catch(() => {});
          }
        } catch (err) {
          logger.warn('[AIController] Error decrementing Redis tutor concurrency:', err);
        }
      }
      if (acquiredMemory) {
        activeTutorGroqCalls = Math.max(0, activeTutorGroqCalls - 1);
      }
    }
  };

  /**
   * POST /api/v1/ai/distractor-analysis
   * Cognitive diagnostic engine performing exam autopsy on incorrect answers.
   */
  analyzeDistractor = async (req: Request, res: Response) => {
    const { questionText, options, correctAnswer, studentAnswer, modelAnswer, subPartLabel, explanation } = req.body;

    if (!questionText || !studentAnswer) {
      return sendResponse(res, 400, 'questionText and studentAnswer are required');
    }

    const diagnostic = await groqProvider.analyzeDistractorAndMisconception({
      questionText,
      options,
      correctAnswer,
      studentAnswer,
      modelAnswer,
      subPartLabel,
      explanation,
    });

    return sendResponse(res, 200, 'Distractor diagnostic completed', diagnostic);
  };

  /**
   * POST /api/v1/ai/refine-explanation
   * Refines or simplifies an explanation using analogies, step-by-step logic, or student queries.
   */
  refineExplanation = async (req: Request, res: Response) => {
    const { questionText, studentAnswer, correctAnswer, modelAnswer, currentExplanation, style, customPrompt } = req.body;

    if (!questionText || !style) {
      return sendResponse(res, 400, 'questionText and style are required');
    }

    const result = await groqProvider.refineExplanation({
      questionText,
      studentAnswer,
      correctAnswer,
      modelAnswer,
      currentExplanation,
      style,
      customPrompt,
    });

    return sendResponse(res, 200, 'Explanation refined successfully', result);
  };
}

export const aiController = new AIController();
