import { Schema, model } from 'mongoose';
import { IAuditLogDocument } from '../types/rbac.types';

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: 'Student', // principal
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
    },
    permissionId: {
      type: Schema.Types.ObjectId,
      ref: 'Permission',
    },
    action: {
      type: String,
      required: true,
    },
    result: {
      type: String,
      enum: ['success', 'denied'],
      required: true,
    },
    reason: String,
    metadata: Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    requestId: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }
);

// We don't necessarily need createdAt/updatedAt if we have timestamp, but we can index timestamp for queries.
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ actorUserId: 1 });
AuditLogSchema.index({ action: 1 });

export const AuditLog = model<IAuditLogDocument>('AuditLog', AuditLogSchema);
