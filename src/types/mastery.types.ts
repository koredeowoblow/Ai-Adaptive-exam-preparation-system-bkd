import { Document, Types } from 'mongoose';

export interface IMasteryRecord {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  topicId: Types.ObjectId;
  eloRating: number;
  questionsAttempted: number;
  questionsCorrect: number;
  lastAttemptedAt: Date;
  recentAnswers: boolean[]; // e.g. [true, false, true] for sliding window
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMasteryRecordDocument extends IMasteryRecord, Document {}

export interface UpdateMasteryDTO {
  isCorrect: boolean;
  questionDifficulty: number;
}
