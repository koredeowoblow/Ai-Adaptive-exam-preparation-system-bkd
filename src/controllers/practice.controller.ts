import { Request, Response } from 'express';
import { practiceService } from '../services/practice.service';
import { courseService } from '../services/course.service';
import { sendResponse } from '../utils/sendResponse';

export class PracticeController {
  startSession = async (req: Request, res: Response) => {
    // @ts-ignore
    const tokenUser = req.user;
    const studentId = tokenUser.id || tokenUser._id;
    
    const totalQuestions = req.body.totalQuestions ?? req.body.questionCount;
    const payload = {
      ...req.body,
      ...(totalQuestions !== undefined ? { totalQuestions } : {}),
    };
    const result = await practiceService.startSession(studentId, payload, tokenUser);
    return sendResponse(res, 200, 'Session started', result);
  };

  getSession = async (req: Request, res: Response) => {
    // @ts-ignore
    const user = req.user;
    
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    const session = await practiceService.getSession(req.params.id as string, user, page, limit);
    return sendResponse(res, 200, 'Session retrieved', session);
  };


  logAntiCheatEvents = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    const sessionId = req.params.id as string;
    const result = await practiceService.logAntiCheatEvents(studentId, sessionId, req.body.events);
    return sendResponse(res, 200, 'Events logged successfully', result);
  };

  submitBatchAnswers = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    const sessionId = req.params.id as string;
    const result = await practiceService.submitBatchAnswers(studentId, sessionId, req.body);
    if (result.status === 'PENDING_GRADING') {
      return sendResponse(res, 202, 'Batch answers submitted, grading in progress', result);
    }
    return sendResponse(res, 200, 'Batch answers submitted successfully', result);
  };

  retrySession = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    const sessionId = req.params.id as string;
    const result = await practiceService.retryGrading(studentId, sessionId);
    return sendResponse(res, 200, 'Grading job requeued successfully', result);
  };

  listSessions = async (req: Request, res: Response) => {
    // @ts-ignore
    const tokenUser = req.user;
    const isAdmin =
      tokenUser?.type === 'admin' ||
      tokenUser?.role === 'admin' ||
      tokenUser?.role === 'superAdmin' ||
      tokenUser?.role === 'superadmin';

    if (isAdmin && (req.query.admin === 'true' || req.query.all === 'true' || req.query.page !== undefined)) {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const courseId = req.query.courseId as string | undefined;
      const studentId = req.query.studentId as string | undefined;
      const status = req.query.status as string | undefined;
      const minScore = req.query.minScore ? parseFloat(req.query.minScore as string) : undefined;
      const maxScore = req.query.maxScore ? parseFloat(req.query.maxScore as string) : undefined;
      const minTrust = req.query.minTrust ? parseFloat(req.query.minTrust as string) : undefined;
      const maxTrust = req.query.maxTrust ? parseFloat(req.query.maxTrust as string) : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

      const result = await practiceService.listAllSessions({
        courseId,
        studentId,
        status,
        minScore,
        maxScore,
        minTrust,
        maxTrust,
        page,
        limit,
        sortBy,
        sortOrder,
      });

      return sendResponse(res, 200, 'Sessions retrieved successfully', result);
    }

    const studentId = tokenUser.id || tokenUser._id;
    const courseId = req.query.courseId as string | undefined;
    const limit = parseInt(req.query.limit as string) || 10;
    const cursor = req.query.cursor as string | undefined;

    const sessions = await practiceService.listSessions(studentId, courseId, limit, cursor);

    return sendResponse(res, 200, 'Sessions retrieved successfully', { sessions, limit, cursor });
  };

  requestExplanation = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    const sessionId = req.params.id as string;
    const answerId = req.params.answerId as string;

    const result = await practiceService.requestExplanation(studentId, sessionId, answerId);
    return sendResponse(res, 202, 'Explanation request processed', result);
  };
}

export const practiceController = new PracticeController();
