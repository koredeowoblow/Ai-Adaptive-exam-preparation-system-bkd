import { Types } from 'mongoose';
import { IntegrityLog, IntegrityEventType, IntegritySeverity } from '../models/integrity.model';

export class IntegrityRepository {
  async createLog(data: {
    sessionId: string;
    studentId: string;
    eventType: IntegrityEventType;
    severity: IntegritySeverity;
    metadata?: Record<string, unknown>;
    timestamp?: Date;
  }) {
    return IntegrityLog.create({
      sessionId: new Types.ObjectId(data.sessionId),
      studentId: new Types.ObjectId(data.studentId),
      eventType: data.eventType,
      severity: data.severity,
      metadata: data.metadata ?? {},
      timestamp: data.timestamp ?? new Date(),
    });
  }

  async findBySession(sessionId: string) {
    return IntegrityLog.find({ sessionId: new Types.ObjectId(sessionId) })
      .sort({ timestamp: -1 })
      .lean();
  }

  async findByStudent(studentId: string, limit: number = 50) {
    return IntegrityLog.find({ studentId: new Types.ObjectId(studentId) })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  async countHighSeverity(sessionId: string): Promise<number> {
    return IntegrityLog.countDocuments({ sessionId: new Types.ObjectId(sessionId), severity: 'HIGH' });
  }

  async findAllLogs(options: {
    page?: number;
    limit?: number;
    severity?: string;
    eventType?: string;
    studentId?: string;
    sessionId?: string;
  } = {}) {
    const { page = 1, limit = 20, severity, eventType, studentId, sessionId } = options;
    const filter: any = {};
    if (severity && severity !== 'all') filter.severity = severity;
    if (eventType && eventType !== 'all') filter.eventType = eventType;
    if (studentId) filter.studentId = new Types.ObjectId(studentId);
    if (sessionId) filter.sessionId = new Types.ObjectId(sessionId);

    const skip = (page - 1) * limit;
    const [items, total, highCount] = await Promise.all([
      IntegrityLog.find(filter)
        .populate('studentId', 'name email level')
        .populate({
          path: 'sessionId',
          select: 'score trustScore status courseId startedAt',
          populate: { path: 'courseId', select: 'title code' },
        })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      IntegrityLog.countDocuments(filter),
      IntegrityLog.countDocuments({ severity: 'HIGH' }),
    ]);

    return {
      items,
      total,
      highCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

export const integrityRepository = new IntegrityRepository();
