import { Schema, model } from 'mongoose';
import { IRoleDocument } from '../types/rbac.types';

const RoleSchema = new Schema<IRoleDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissionIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],
    isSystem: {
      type: Boolean,
      default: false,
    },
    isProtected: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Student', // Student is the authenticated principal
    },
  },
  {
    timestamps: true,
  }
);

export const Role = model<IRoleDocument>('Role', RoleSchema);
