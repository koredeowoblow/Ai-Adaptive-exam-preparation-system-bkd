import { Schema, model } from 'mongoose';
import { IStudentDocument } from '../types/student.types';

const StudentSchema = new Schema<IStudentDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Don't return password by default
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    level: {
      type: String,
      enum: ['100L', '200L', '300L', '400L', '500L'],
      default: '100L',
    },
    nextExamDate: {
      type: String,
      default: null,
      trim: true,
    },
    enrolledCourseIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    roleIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Role',
      }
    ],
    isOnboarded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

StudentSchema.index({ roleIds: 1 });

export const Student = model<IStudentDocument>('Student', StudentSchema);
