import { Request, Response } from 'express';
import { groqProvider } from '../providers/groq.provider';
import { aiService } from '../services/ai.service';
import { sendResponse } from '../utils/sendResponse';
import { validateExamDate } from '../utils/dateValidation';

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
   */
  socraticTutorChat = async (req: Request, res: Response) => {
    const { questionContext, messages } = req.body;

    if (!questionContext || !questionContext.questionText) {
      return sendResponse(res, 400, 'questionContext with questionText is required');
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return sendResponse(res, 400, 'messages array is required');
    }

    const reply = await groqProvider.generateSocraticTutorResponse(questionContext, messages);
    return sendResponse(res, 200, 'Socratic tutor response generated', { reply });
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
