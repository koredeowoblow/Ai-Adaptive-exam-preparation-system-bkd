import { Document, Types } from 'mongoose';

export interface IStreakRecord {
  studentId: Types.ObjectId;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStreakRecordDocument extends IStreakRecord, Document {}
