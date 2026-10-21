import { Schema, model, Types } from 'mongoose';
import {
  IStudyPlanDocument,
  IStudyPlanWeek,
  IStudyPlanDay,
  IStudyPlanTask
} from '../types/studyPlan.types';

const StudyPlanTaskSchema = new Schema<IStudyPlanTask>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      default: () => new Types.ObjectId(),
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      enum: ['STUDY', 'PRACTICE', 'REVISION', 'EXAM_PREP'],
      default: 'STUDY',
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 45,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const StudyPlanDaySchema = new Schema<IStudyPlanDay>(
  {
    date: {
      type: String,
      required: true,
      trim: true,
    },
    dayName: {
      type: String,
      required: true,
      trim: true,
    },
    tasks: {
      type: [StudyPlanTaskSchema],
      default: [],
    },
  },
  { _id: false }
);

const StudyPlanWeekSchema = new Schema<IStudyPlanWeek>(
  {
    weekNumber: {
      type: Number,
      required: true,
    },
    startDate: {
      type: String,
      required: true,
      trim: true,
    },
    endDate: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'GENERATING', 'READY'],
      default: 'NOT_STARTED',
    },
    generatingStartedAt: {
      type: Date,
      default: null,
    },
    summary: {
      type: String,
      default: '',
      trim: true,
    },
    days: {
      type: [StudyPlanDaySchema],
      default: [],
    },
  },
  { _id: false }
);

const StudyPlanSchema = new Schema<IStudyPlanDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
    archivedReason: {
      type: String,
      default: null,
      trim: true,
    },
    startDate: {
      type: String,
      required: true,
      trim: true,
    },
    endDate: {
      type: String,
      required: true,
      trim: true,
    },
    totalWeeks: {
      type: Number,
      required: true,
    },
    examDatesSnapshot: {
      type: Map,
      of: String,
      default: () => new Map(),
    },
    skeletonVersion: {
      type: Number,
      default: 1,
    },
    weeks: {
      type: [StudyPlanWeekSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// One active plan per student: partial unique index
StudyPlanSchema.index(
  { studentId: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

// Query optimization for student plans by status
StudyPlanSchema.index({ studentId: 1, status: 1 });

export const StudyPlan = model<IStudyPlanDocument>('StudyPlan', StudyPlanSchema);
