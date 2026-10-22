import { IntegrityEventType, IntegritySeverity } from '../models/integrity.model';
import { integrityRepository } from '../repositories/integrity.repository';
import { AppError } from '../utils/AppError';

// Severity mapping - mirrors what the frontend also enforces
const SEVERITY_MAP: Record<IntegrityEventType, IntegritySeverity> = {
  WINDOW_BLUR: 'MEDIUM',
  VISIBILITY_CHANGE: 'HIGH',
  COPY_ATTEMPT: 'MEDIUM',
  PASTE_ATTEMPT: 'LOW',
  CUT_ATTEMPT: 'MEDIUM',
  MOUSE_LEAVE: 'LOW',
  CONTEXT_MENU: 'LOW',
  MULTIPLE_VOICES_DETECTED: 'HIGH',
  AI_PASTE_DETECTED: 'HIGH',
  UNNATURAL_TYPING_VELOCITY: 'HIGH',
  AI_HONEYPOT_TRIGGERED: 'HIGH',
};

export interface LogViolationDTO {
  sessionId: string;
  eventType: IntegrityEventType;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

export class IntegrityService {
  async logViolation(studentId: string, data: LogViolationDTO) {
    const severity = SEVERITY_MAP[data.eventType];
    if (!severity) {
      throw new AppError(`Unknown integrity event type: ${data.eventType}`, 400);
    }

    // IDOR Check: Ensure the reported session belongs to the authenticated student
    if (data.sessionId) {
      const { PracticeSession } = await import('../models/practice.model');
      const session = await PracticeSession.findById(data.sessionId).select('studentId').lean();
      if (!session) {
        throw new AppError('Session not found', 404);
      }
      const sessionStudentId = (session.studentId as any)?._id?.toString() || session.studentId?.toString();
      if (sessionStudentId !== studentId.toString()) {
        throw new AppError('Forbidden: Session does not belong to authenticated student', 403);
      }
    }

    const log = await integrityRepository.createLog({
      sessionId: data.sessionId,
      studentId,
      eventType: data.eventType,
      severity,
      metadata: data.metadata,
      timestamp: data.timestamp,
    });

    return log;
  }

  async getSessionViolations(sessionId: string) {
    return integrityRepository.findBySession(sessionId);
  }

  async getStudentViolations(studentId: string, limit = 50) {
    return integrityRepository.findByStudent(studentId, limit);
  }

  /**
   * Counts HIGH severity violations for a given session.
   * Can be used by practice service to decide if session should be terminated.
   */
  async countHighSeverityViolations(sessionId: string): Promise<number> {
    return integrityRepository.countHighSeverity(sessionId);
  }

  async listViolations(options: {
    page?: number;
    limit?: number;
    severity?: string;
    eventType?: string;
    studentId?: string;
    sessionId?: string;
  }) {
    return integrityRepository.findAllLogs(options);
  }

  /**
   * Returns all active test sessions with live integrity metrics for invigilators.
   */
  async getLiveSessions() {
    const { PracticeSession } = await import('../models/practice.model');
    const { IntegrityLog } = await import('../models/integrity.model');

    const sessions = await PracticeSession.find({ status: 'active' })
      .populate('studentId', 'fullName email matricNumber')
      .populate('courseId', 'title code')
      .sort({ startedAt: -1 })
      .lean();

    const liveData = await Promise.all(
      sessions.map(async (s: any) => {
        const violationCount = await IntegrityLog.countDocuments({ sessionId: s._id });
        const highSeverityCount = await IntegrityLog.countDocuments({ sessionId: s._id, severity: 'HIGH' });
        const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(s.startedAt).getTime()) / 1000));
        
        let riskLevel: 'NORMAL' | 'CAUTION' | 'CRITICAL' = 'NORMAL';
        if (s.trustScore < 60 || highSeverityCount >= 2 || violationCount >= 5) {
          riskLevel = 'CRITICAL';
        } else if (s.trustScore < 85 || highSeverityCount >= 1 || violationCount >= 2) {
          riskLevel = 'CAUTION';
        }

        return {
          sessionId: s._id,
          student: s.studentId,
          course: s.courseId,
          startedAt: s.startedAt,
          elapsedSeconds,
          questionsAnswered: s.questionsAnswered || 0,
          totalQuestions: s.totalQuestions || 10,
          trustScore: s.trustScore,
          violationCount,
          highSeverityCount,
          riskLevel,
          proctorWarning: s.proctorWarning,
          proctorWarningAt: s.proctorWarningAt,
        };
      })
    );

    return liveData;
  }

  async sendProctorWarning(sessionId: string, message: string) {
    const { PracticeSession } = await import('../models/practice.model');
    const session = await PracticeSession.findByIdAndUpdate(
      sessionId,
      {
        proctorWarning: message,
        proctorWarningAt: new Date(),
      },
      { returnDocument: 'after' }
    );
    if (!session) {
      throw new AppError('Exam session not found', 404);
    }
    return session;
  }

  async terminateSession(sessionId: string, reason?: string) {
    const { PracticeSession } = await import('../models/practice.model');
    const session = await PracticeSession.findByIdAndUpdate(
      sessionId,
      {
        status: 'TERMINATED_BY_PROCTOR',
        endedAt: new Date(),
        terminatedReason: reason || 'Terminated by proctor for integrity non-compliance',
      },
      { returnDocument: 'after' }
    );
    if (!session) {
      throw new AppError('Exam session not found', 404);
    }
    return session;
  }
}

export const integrityService = new IntegrityService();
