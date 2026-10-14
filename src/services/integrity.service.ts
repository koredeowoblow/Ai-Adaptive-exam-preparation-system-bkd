import { IntegrityEventType, IntegritySeverity } from '../models/integrity.model';
import { integrityRepository } from '../repositories/integrity.repository';
import { AppError } from '../utils/AppError';

// Severity mapping — mirrors what the frontend also enforces
const SEVERITY_MAP: Record<IntegrityEventType, IntegritySeverity> = {
  WINDOW_BLUR: 'MEDIUM',
  VISIBILITY_CHANGE: 'HIGH',
  COPY_ATTEMPT: 'MEDIUM',
  PASTE_ATTEMPT: 'LOW',
  CUT_ATTEMPT: 'MEDIUM',
  MOUSE_LEAVE: 'LOW',
  CONTEXT_MENU: 'LOW',
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
}

export const integrityService = new IntegrityService();
