import { Document, Types } from 'mongoose';

export interface IPermission {
  name: string;
  slug: string;
  resource: string;
  action: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPermissionDocument extends IPermission, Document {}

export interface IRole {
  name: string;
  slug: string;
  description?: string;
  permissionIds: Types.ObjectId[];
  isSystem: boolean;
  isProtected: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoleDocument extends IRole, Document {}

export interface IAuditLog {
  actorUserId?: Types.ObjectId; // Optional in case system acts
  targetUserId?: Types.ObjectId;
  roleId?: Types.ObjectId;
  permissionId?: Types.ObjectId;
  action: string;
  result: 'success' | 'denied';
  reason?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  timestamp: Date;
}

export interface IAuditLogDocument extends IAuditLog, Document {}
