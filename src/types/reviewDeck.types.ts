import { Document, Types } from 'mongoose';

export type LeitnerBox = 1 | 2 | 3 | 4 | 5;
export type ReviewRating = 'again' | 'good' | 'easy';

export interface IReviewCard {
  studentId: Types.ObjectId;
  questionId: Types.ObjectId;
  courseId: Types.ObjectId;
  topicId: Types.ObjectId;
  box: LeitnerBox;
  intervalDays: number;
  consecutiveCorrect: number;
  totalReviews: number;
  totalLapses: number;
  lastReviewedAt?: Date;
  nextReviewDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReviewCardDocument extends IReviewCard, Document {}

export interface ReviewDeckSummary {
  totalCards: number;
  dueToday: number;
  boxes: {
    box1: number; // 1-day interval
    box2: number; // 3-day interval
    box3: number; // 7-day interval
    box4: number; // 14-day interval
    box5: number; // 30-day interval (Mastered)
  };
  retentionRate: number; // Percentage of reviews that were correct
}
