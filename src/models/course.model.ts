import { Schema, model } from 'mongoose';
import { ICourseDocument } from '../types/course.types';

const CourseSchema = new Schema<ICourseDocument>(
  {
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    code: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    level: {
      type: Number,
    },
    topics: {
      type: [String],
      default: [],
    },
    prerequisites: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index just in case, but code is globally unique for now
CourseSchema.index({ departmentId: 1 });
// Compound index for fast cursor pagination and filtering by department
CourseSchema.index({ departmentId: 1, _id: -1 });

export const Course = model<ICourseDocument>('Course', CourseSchema);
