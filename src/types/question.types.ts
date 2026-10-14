import { Document, Types } from 'mongoose';

export interface IQuestionOption {
  id: string;
  text: string;
}

export interface IQuestion {
  type: 'MULTIPLE_CHOICE' | 'THEORY';
  topicId: Types.ObjectId;
  questionText: string;
  options?: IQuestionOption[];
  correctAnswer?: string; // The ID of the correct option (for MCQ)
  modelAnswer?: string; // For THEORY
  rubric?: { point: string; weight: number }[]; // For THEORY
  eloRating: number; // e.g., 850-2000
  timesAnswered: number;
  timesCorrect: number;
  exposureCount: number;
  explanation: string;
  explanationSource: 'manual' | 'ai';
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuestionDocument extends IQuestion, Document {}

export interface CreateQuestionDTO {
  type?: 'MULTIPLE_CHOICE' | 'THEORY';
  topicId: string;
  questionText: string;
  options?: IQuestionOption[];
  correctAnswer?: string;
  modelAnswer?: string;
  rubric?: { point: string; weight: number }[];
  eloRating?: number; // Optional on create, defaults to 1000
  explanation: string;
  explanationSource?: 'manual' | 'ai';
}

export interface UpdateQuestionDTO {
  type?: 'MULTIPLE_CHOICE' | 'THEORY';
  questionText?: string;
  options?: IQuestionOption[];
  correctAnswer?: string;
  modelAnswer?: string;
  rubric?: { point: string; weight: number }[];
  eloRating?: number;
  explanation?: string;
  explanationSource?: 'manual' | 'ai';
}
