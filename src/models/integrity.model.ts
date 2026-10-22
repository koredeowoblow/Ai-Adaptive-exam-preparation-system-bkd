import { Schema, model, Document, Types } from 'mongoose';

export type IntegrityEventType = 
  | 'WINDOW_BLUR' 
  | 'VISIBILITY_CHANGE' 
  | 'COPY_ATTEMPT' 
  | 'PASTE_ATTEMPT' 
  | 'CUT_ATTEMPT' 
  | 'MOUSE_LEAVE'
  | 'CONTEXT_MENU'
  | 'MULTIPLE_VOICES_DETECTED'
  | 'AI_PASTE_DETECTED'
  | 'UNNATURAL_TYPING_VELOCITY'
  | 'AI_HONEYPOT_TRIGGERED';

export type IntegritySeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface IIntegrityLog extends Document {
  sessionId: Types.ObjectId;
  studentId: Types.ObjectId;
  eventType: IntegrityEventType;
  severity: IntegritySeverity;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const IntegrityLogSchema = new Schema<IIntegrityLog>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'PracticeSession',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: ['WINDOW_BLUR', 'VISIBILITY_CHANGE', 'COPY_ATTEMPT', 'PASTE_ATTEMPT', 'CUT_ATTEMPT', 'MOUSE_LEAVE', 'CONTEXT_MENU', 'MULTIPLE_VOICES_DETECTED'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false, // We use `timestamp` field directly
  }
);

// Compound index for efficient per-session and per-student queries
IntegrityLogSchema.index({ sessionId: 1, studentId: 1 });

export const IntegrityLog = model<IIntegrityLog>('IntegrityLog', IntegrityLogSchema);
