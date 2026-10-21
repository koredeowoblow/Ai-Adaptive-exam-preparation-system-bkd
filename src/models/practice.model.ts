import { Schema, model } from 'mongoose';
import { IPracticeSessionDocument } from '../types/practice.types';

const SubPartAnswerSchema = new Schema(
  {
    partId: { type: String, required: true },
    label: { type: String },
    writtenAnswer: { type: String, default: '' },
    score: { type: Number },
    marksAwarded: { type: Number },
    maxMarks: { type: Number },
    feedback: { type: String },
    rubricCriteriaMet: [{ type: String }],
    correct: { type: Boolean },
  },
  { _id: false }
);

const PracticeAnswerSchema = new Schema(
  {
    submissionId: { type: String, required: true }, // Added for idempotency
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    difficulty: { type: Number, required: true },
    selectedAnswer: { type: String }, // Optional for theory
    writtenAnswer: { type: String }, // For theory
    subPartAnswers: [SubPartAnswerSchema], // For multi-part theory questions
    correct: { type: Boolean }, // Optional, might be pending
    gradingStatus: { type: String, enum: ['PENDING', 'GRADED', 'FAILED'], default: 'GRADED' },
    score: { type: Number },
    feedback: { type: String },
    timeTaken: { type: Number }, // in seconds
    answeredAt: { type: Date, default: Date.now },
    aiExplanation: { type: String },
    explanationStatus: { type: String, enum: ['PENDING', 'READY', 'FAILED'] },
  },
  { _id: false }
);

const AntiCheatEventSchema = new Schema(
  {
    type: { type: String, enum: ['TAB_SWITCH', 'PASTE_DETECTED', 'FAST_ANSWER', 'DEVTOOLS_DETECTED', 'RIGHT_CLICK_BLOCKED'], required: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
    timestamp: { type: Date, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const PracticeSessionSchema = new Schema<IPracticeSessionDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    status: { type: String, enum: ['active', 'PENDING_GRADING', 'completed', 'FAILED'], default: 'active' },
    currentQuestionId: { type: Schema.Types.ObjectId, ref: 'Question' }, // Added for atomic state transition
    currentQuestionStartedAt: { type: Date }, // Added to track server-side elapsed time
    questionsServed: [PracticeAnswerSchema],
    totalQuestions: { type: Number, default: 10 },
    questionsAnswered: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    trustScore: { type: Number, default: 100 },
    antiCheatEvents: [AntiCheatEventSchema],
    timeBudget: { type: Number },
    lateSubmission: { type: Boolean, default: false },
    questionTypeMix: { type: String, enum: ['MIXED', 'OBJECTIVE_ONLY', 'THEORY_ONLY'], default: 'MIXED' },
    mode: { type: String, enum: ['quick', 'mock', 'diagnostic'], default: 'quick', required: true },
    clampedMessage: { type: String }, // Populated when totalQuestions was clamped by the level cap
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

PracticeSessionSchema.index({ studentId: 1, courseId: 1, status: 1 });
PracticeSessionSchema.index({ studentId: 1, status: 1, endedAt: -1 });

// Durable guard: exactly one active session per student, course, and mode
PracticeSessionSchema.index(
  { studentId: 1, courseId: 1, mode: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

export const PracticeSession = model<IPracticeSessionDocument>('PracticeSession', PracticeSessionSchema);

// Explicitly listen to index error events so autoIndex failures are never silent
PracticeSession.on('index', (error) => {
  if (error) {
    console.error('[Mongoose:IndexError] Failed to build PracticeSession unique index:', error);
  } else {
    console.log('[Mongoose:IndexSuccess] PracticeSession indexes successfully synchronized.');
  }
});
