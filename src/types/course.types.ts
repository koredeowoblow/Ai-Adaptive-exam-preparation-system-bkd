import { Document, Types } from 'mongoose';

export interface ICourse {
  departmentId: Types.ObjectId;
  code: string;
  title: string;
  description?: string;
  level?: number;
  topics?: string[];
  prerequisites?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourseDocument extends ICourse, Document {}

export interface CreateCourseDTO {
  departmentId: string;
  code: string;
  title: string;
  description?: string;
  level?: number;
  topics?: string[];
  prerequisites?: string[];
}

export interface UpdateCourseDTO {
  departmentId?: string;
  code?: string;
  title?: string;
  description?: string;
  level?: number;
  topics?: string[];
  prerequisites?: string[];
}
