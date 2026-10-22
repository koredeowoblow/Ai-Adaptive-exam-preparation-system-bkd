import { Request, Response } from 'express';
import { integrityService } from '../services/integrity.service';
import { sendResponse } from '../utils/sendResponse';

export class IntegrityController {
  /**
   * POST /api/v1/integrity/log
   * Called by the frontend anti-cheat hook to record a suspicious event.
   */
  logViolation = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    const log = await integrityService.logViolation(studentId, req.body);
    return sendResponse(res, 201, 'Integrity event logged', log);
  };

  /**
   * GET /api/v1/integrity/session/:sessionId
   * Admin endpoint to inspect all violations for a given session.
   */
  getSessionViolations = async (req: Request, res: Response) => {
    const violations = await integrityService.getSessionViolations(req.params.sessionId as string);
    return sendResponse(res, 200, 'Session violations retrieved', violations);
  };

  /**
   * GET /api/v1/integrity/student/:studentId
   * Admin endpoint to inspect all violations for a given student.
   */
  getStudentViolations = async (req: Request, res: Response) => {
    const violations = await integrityService.getStudentViolations(req.params.studentId as string);
    return sendResponse(res, 200, 'Student violations retrieved', violations);
  };

  /**
   * GET /api/v1/integrity
   * Admin endpoint to list all violations with server-side pagination and filters.
   */
  listViolations = async (req: Request, res: Response) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const severity = req.query.severity as string | undefined;
    const eventType = req.query.eventType as string | undefined;
    const studentId = req.query.studentId as string | undefined;
    const sessionId = req.query.sessionId as string | undefined;

    const result = await integrityService.listViolations({
      page,
      limit,
      severity,
      eventType,
      studentId,
      sessionId,
    });
    return sendResponse(res, 200, 'Integrity violation logs retrieved successfully', result);
  };

  /**
   * GET /api/v1/integrity/live-sessions
   * Live proctoring monitor feed of all active test sessions.
   */
  getLiveSessions = async (req: Request, res: Response) => {
    const liveSessions = await integrityService.getLiveSessions();
    return sendResponse(res, 200, 'Live proctoring sessions retrieved successfully', liveSessions);
  };

  /**
   * POST /api/v1/integrity/session/:sessionId/warn
   * Invigilator sends a direct warning message to student's screen.
   */
  sendWarning = async (req: Request, res: Response) => {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return sendResponse(res, 400, 'Warning message text is required');
    }
    const session = await integrityService.sendProctorWarning(req.params.sessionId as string, message);
    return sendResponse(res, 200, 'Proctor warning transmitted successfully', session);
  };

  /**
   * POST /api/v1/integrity/session/:sessionId/terminate
   * Invigilator forcibly terminates a compromised exam.
   */
  terminateSession = async (req: Request, res: Response) => {
    const { reason } = req.body;
    const session = await integrityService.terminateSession(req.params.sessionId as string, reason);
    return sendResponse(res, 200, 'Exam session terminated by proctor', session);
  };
}

export const integrityController = new IntegrityController();
