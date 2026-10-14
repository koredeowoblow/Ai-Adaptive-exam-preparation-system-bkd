import { Document, Types } from 'mongoose';

export interface ILeaderboardEntry {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  score: number;
  rank?: number; // Virtual or calculated
  updatedAt: Date;
}

export interface ILeaderboardEntryDocument extends ILeaderboardEntry, Document {}
