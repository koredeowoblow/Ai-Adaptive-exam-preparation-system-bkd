import { Request, Response } from 'express';
import { groqProvider } from '../providers/groq.provider';
import { aiService } from '../services/ai.service';
import { sendResponse } from '../utils/sendResponse';

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

    const rawPlan = await groqProvider.generateStudyPlan(studentStats, department, level, nextExamDate);
    let plan;
    try {
      plan = JSON.parse(rawPlan);
    } catch {
      plan = { raw: rawPlan };
    }
    return sendResponse(res, 200, 'Study plan generated', { plan });
  };
}

export const aiController = new AIController();
