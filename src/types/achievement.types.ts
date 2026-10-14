import { Document, Types } from 'mongoose';

export interface IAchievement {
  name: string;
  description: string;
  icon?: string;
  requirement: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAchievementDocument extends IAchievement, Document {}

export interface IStudentAchievement {
  studentId: Types.ObjectId;
  achievementId: Types.ObjectId;
  unlockedAt: Date;
}

export interface IStudentAchievementDocument extends IStudentAchievement, Document {}

export interface CreateAchievementDTO {
  name: string;
  description: string;
  icon?: string;
  requirement: string;
}
