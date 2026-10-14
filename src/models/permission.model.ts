import { Schema, model } from 'mongoose';
import { IPermissionDocument } from '../types/rbac.types';

const PermissionSchema = new Schema<IPermissionDocument>(
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
    resource: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique (resource, action) pair
PermissionSchema.index({ resource: 1, action: 1 }, { unique: true });

export const Permission = model<IPermissionDocument>('Permission', PermissionSchema);
