import { Schema, model } from 'mongoose';
import { IStreakRecordDocument } from '../types/streak.types';

const StreakRecordSchema = new Schema<IStreakRecordDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastActivityDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const StreakRecord = model<IStreakRecordDocument>('StreakRecord', StreakRecordSchema);
