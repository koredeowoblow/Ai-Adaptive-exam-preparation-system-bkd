import { Schema, model } from 'mongoose';
import { IDepartmentDocument } from '../types/department.types';

const DepartmentSchema = new Schema<IDepartmentDocument>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Will link to admin/user model later
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Department = model<IDepartmentDocument>('Department', DepartmentSchema);
