import { Document, Types } from 'mongoose';

export type QuestionTypeMix = 'MIXED' | 'OBJECTIVE_ONLY' | 'THEORY_ONLY';

export interface IPracticeAnswer {
  submissionId: string;
  questionId: Types.ObjectId;
  topicId: Types.ObjectId;
  difficulty: number;
  selectedAnswer?: string;
  writtenAnswer?: string; // For THEORY
  correct?: boolean | null; // Optional, pending theory questions might not have it yet
  gradingStatus: 'PENDING' | 'GRADED' | 'FAILED';
  score?: number | null; // 0-1 score for theory questions
  feedback?: string; // AI grader feedback
  timeTaken?: number;
  answeredAt: Date;
  aiExplanation?: string;
  explanationStatus?: 'PENDING' | 'READY' | 'FAILED';
}

export type AntiCheatEventType = 'TAB_SWITCH' | 'PASTE_DETECTED' | 'FAST_ANSWER' | 'DEVTOOLS_DETECTED' | 'RIGHT_CLICK_BLOCKED';

export interface IAntiCheatEvent {
  type: AntiCheatEventType;
  questionId?: Types.ObjectId;
  timestamp: Date;
  metadata?: any;
}

export interface IPracticeSession {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  status: 'active' | 'PENDING_GRADING' | 'completed' | 'FAILED';
  currentQuestionId?: Types.ObjectId;
  currentQuestionStartedAt?: Date;
  questionsServed: IPracticeAnswer[];
  totalQuestions: number;
  questionsAnswered: number;
  correctAnswers: number;
  score: number | null;
  trustScore: number;
  antiCheatEvents: IAntiCheatEvent[];
  timeBudget?: number; // in seconds
  lateSubmission?: boolean;
  questionTypeMix?: QuestionTypeMix;
  mode?: 'quick' | 'mock' | 'diagnostic';
  clampedMessage?: string; // Set when totalQuestions was clamped by the level cap
  isArchived?: boolean;
  archivedAt?: Date;
  isGradingPending?: boolean;
  gradingState?: string;
}

export interface IPracticeSessionDocument extends IPracticeSession, Document {}

export interface StartSessionDTO {
  courseId: string;
  totalQuestions?: number;
  questionType?: QuestionTypeMix;
  mode?: 'quick' | 'mock' | 'diagnostic';
}

export interface SubmitAnswerDTO {
  submissionId: string;
  questionId: string;
  selectedAnswer?: string;
  writtenAnswer?: string;
  timeTaken?: number;
}

export interface SubmitBatchAnswersDTO {
  answers: {
    questionId: string;
    selectedAnswer?: string;
    writtenAnswer?: string;
    timeTaken?: number;
  }[];
}

export interface LogAntiCheatEventDTO {
  events: {
    type: AntiCheatEventType;
    questionId?: string;
    timestamp: Date;
    metadata?: any;
  }[];
}
