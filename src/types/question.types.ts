import { Document, Types } from 'mongoose';

export interface IQuestionOption {
  id: string;
  text: string;
}

export interface IQuestionSubPart {
  id: string; // e.g. "a", "b_i", "b_ii"
  label: string; // e.g. "1(a)", "1(b)(i)", "(a)"
  prompt: string;
  maxMarks?: number;
  modelAnswer: string;
  rubric: { point: string; weight: number }[];
  diagramUrl?: string;
  diagramCaption?: string;
  order: number;
}

export interface IQuestion {
  type: 'MULTIPLE_CHOICE' | 'THEORY';
  topicId: Types.ObjectId;
  questionText: string;
  diagramUrl?: string;
  diagramCaption?: string;
  hasSubParts?: boolean;
  subParts?: IQuestionSubPart[];
  options?: IQuestionOption[];
  correctAnswer?: string; // The ID of the correct option (for MCQ)
  modelAnswer?: string; // For single THEORY
  rubric?: { point: string; weight: number }[]; // For single THEORY
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
  diagramUrl?: string;
  diagramCaption?: string;
  hasSubParts?: boolean;
  subParts?: IQuestionSubPart[];
  options?: IQuestionOption[];
  correctAnswer?: string;
  modelAnswer?: string;
  rubric?: { point: string; weight: number }[];
  eloRating?: number; // Optional on create, defaults to 1000
  explanation?: string;
  explanationSource?: 'manual' | 'ai';
}

export interface UpdateQuestionDTO {
  type?: 'MULTIPLE_CHOICE' | 'THEORY';
  questionText?: string;
  diagramUrl?: string;
  diagramCaption?: string;
  hasSubParts?: boolean;
  subParts?: IQuestionSubPart[];
  options?: IQuestionOption[];
  correctAnswer?: string;
  modelAnswer?: string;
  rubric?: { point: string; weight: number }[];
  eloRating?: number;
  explanation?: string;
  explanationSource?: 'manual' | 'ai';
}
