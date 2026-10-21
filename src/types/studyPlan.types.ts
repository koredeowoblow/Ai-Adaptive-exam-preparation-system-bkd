import { Document, Types } from 'mongoose';

export type StudyTaskType = 'STUDY' | 'PRACTICE' | 'REVISION' | 'EXAM_PREP';
export type StudyWeekStatus = 'NOT_STARTED' | 'GENERATING' | 'READY';
export type StudyPlanStatus = 'active' | 'archived';

export interface IStudyPlanTask {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  topicId?: Types.ObjectId;
  title: string;
  description?: string;
  type: StudyTaskType;
  durationMinutes: number;
  completedAt: Date | null;
}

export interface IStudyPlanDay {
  date: string; // YYYY-MM-DD
  dayName: string; // Monday, Tuesday, etc.
  tasks: IStudyPlanTask[];
}

export interface IStudyPlanWeek {
  weekNumber: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: StudyWeekStatus;
  generatingStartedAt: Date | null;
  summary: string;
  days: IStudyPlanDay[];
}

export interface IStudyPlan {
  studentId: Types.ObjectId;
  status: StudyPlanStatus;
  archivedReason?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalWeeks: number;
  examDatesSnapshot: Map<string, string>;
  skeletonVersion: number;
  weeks: IStudyPlanWeek[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudyPlanDocument extends IStudyPlan, Document {}
