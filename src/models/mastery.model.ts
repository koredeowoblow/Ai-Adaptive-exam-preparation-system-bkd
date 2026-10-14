import { Schema, model } from 'mongoose';
import { IMasteryRecordDocument } from '../types/mastery.types';

const MasteryRecordSchema = new Schema<IMasteryRecordDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
    },
    eloRating: {
      type: Number,
      default: 1000,
      min: 0,
    },
    questionsAttempted: {
      type: Number,
      default: 0,
    },
    questionsCorrect: {
      type: Number,
      default: 0,
    },
    lastAttemptedAt: {
      type: Date,
      default: Date.now,
    },
    recentAnswers: {
      type: [Boolean],
      default: [],
    },
    confidence: {
      type: Number,
      default: 0.1, // Starts low, climbs as questionsAttempted increases
      min: 0,
      max: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Critical compound index
MasteryRecordSchema.index({ studentId: 1, courseId: 1, topicId: 1 }, { unique: true });

export const MasteryRecord = model<IMasteryRecordDocument>('MasteryRecord', MasteryRecordSchema);
