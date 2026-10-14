import { Schema, model } from 'mongoose';
import { ILeaderboardEntryDocument } from '../types/leaderboard.types';

const LeaderboardEntrySchema = new Schema<ILeaderboardEntryDocument>(
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
    score: {
      type: Number,
      default: 0,
      index: -1, // Sort descending
    },
  },
  {
    timestamps: true,
  }
);

LeaderboardEntrySchema.index({ courseId: 1, studentId: 1 }, { unique: true });
LeaderboardEntrySchema.index({ courseId: 1, score: -1 });

export const LeaderboardEntry = model<ILeaderboardEntryDocument>('LeaderboardEntry', LeaderboardEntrySchema);
