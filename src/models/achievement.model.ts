import { Schema, model } from 'mongoose';
import { IAchievementDocument, IStudentAchievementDocument } from '../types/achievement.types';

const AchievementSchema = new Schema<IAchievementDocument>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String },
    requirement: { type: String, required: true },
  },
  { timestamps: true }
);

export const Achievement = model<IAchievementDocument>('Achievement', AchievementSchema);

const StudentAchievementSchema = new Schema<IStudentAchievementDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    achievementId: { type: Schema.Types.ObjectId, ref: 'Achievement', required: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

StudentAchievementSchema.index({ studentId: 1, achievementId: 1 }, { unique: true });

export const StudentAchievement = model<IStudentAchievementDocument>('StudentAchievement', StudentAchievementSchema);
