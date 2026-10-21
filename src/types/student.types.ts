import { Document, Types } from 'mongoose';

export interface IStudent {
  name: string;
  email: string;
  passwordHash: string;
  departmentId?: Types.ObjectId;
  level?: '100L' | '200L' | '300L' | '400L' | '500L';
  nextExamDate?: string | null;
  courseExamDates?: Map<string, string>;
  enrolledCourseIds: Types.ObjectId[];
  roleIds: Types.ObjectId[];
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudentDocument extends IStudent, Document {}

export interface CreateStudentDTO {
  name: string;
  email: string;
  passwordHash: string;
}

export interface UpdateStudentDTO {
  name?: string;
  departmentId?: string;
  level?: '100L' | '200L' | '300L' | '400L' | '500L';
  nextExamDate?: string | null;
  enrolledCourseIds?: string[];
  isOnboarded?: boolean;
}

export interface CompleteOnboardingDTO {
  departmentId?: string;
  level?: '100L' | '200L' | '300L' | '400L' | '500L';
  nextExamDate?: string | null;
  courseIds?: string[];
}

export interface PromoteStudentDTO {
  targetLevel: '100L' | '200L' | '300L' | '400L' | '500L';
  courseIds?: string[];
  nextExamDate?: string | null;
}

