import { Schema, model } from 'mongoose';
import { IReviewCardDocument } from '../types/reviewDeck.types';

const ReviewCardSchema = new Schema<IReviewCardDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
    },
    box: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      default: 1,
      index: true,
    },
    intervalDays: {
      type: Number,
      default: 1,
    },
    consecutiveCorrect: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalLapses: {
      type: Number,
      default: 0,
    },
    lastReviewedAt: {
      type: Date,
    },
    nextReviewDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique card per student + question
ReviewCardSchema.index({ studentId: 1, questionId: 1 }, { unique: true });

// Efficient lookups for due cards
ReviewCardSchema.index({ studentId: 1, nextReviewDate: 1 });
ReviewCardSchema.index({ studentId: 1, courseId: 1, nextReviewDate: 1 });

export const ReviewCard = model<IReviewCardDocument>('ReviewCard', ReviewCardSchema);
