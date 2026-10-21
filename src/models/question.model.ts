import { Schema, model } from 'mongoose';
import { IQuestionDocument } from '../types/question.types';

const QuestionOptionSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const QuestionSubPartSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    prompt: { type: String, required: true, trim: true },
    maxMarks: { type: Number, default: 1 },
    modelAnswer: { type: String, required: true, trim: true },
    rubric: {
      type: [
        {
          point: { type: String, required: true },
          weight: { type: Number, required: true },
        },
      ],
      required: true,
      validate: [
        (val: any[]) => Array.isArray(val) && val.length > 0,
        'Each sub-part must have at least 1 rubric point',
      ],
    },
    diagramUrl: { type: String },
    diagramCaption: { type: String },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const QuestionSchema = new Schema<IQuestionDocument>(
  {
    type: {
      type: String,
      enum: ['MULTIPLE_CHOICE', 'THEORY'],
      default: 'MULTIPLE_CHOICE',
      required: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    diagramUrl: {
      type: String,
    },
    diagramCaption: {
      type: String,
    },
    hasSubParts: {
      type: Boolean,
      default: false,
    },
    subParts: {
      type: [QuestionSubPartSchema],
      validate: [
        function(this: IQuestionDocument, val: any[]) {
          if (this.type !== 'THEORY' || !this.hasSubParts) return true;
          return Array.isArray(val) && val.length > 0;
        },
        'A multi-part theory question must have at least one sub-part',
      ],
    },
    options: {
      type: [QuestionOptionSchema],
      required: function(this: IQuestionDocument) { return this.type === 'MULTIPLE_CHOICE'; },
      validate: [
        function(this: IQuestionDocument, val: any[]) { 
          if (this.type !== 'MULTIPLE_CHOICE') return true;
          return val && val.length >= 2; 
        },
        'A multiple choice question must have at least 2 options',
      ],
    },
    correctAnswer: {
      type: String,
      required: function(this: IQuestionDocument) { return this.type === 'MULTIPLE_CHOICE'; },
    },
    modelAnswer: {
      type: String,
      required: function(this: IQuestionDocument) {
        return this.type === 'THEORY' && !this.hasSubParts && (!this.subParts || this.subParts.length === 0);
      },
    },
    rubric: {
      type: [{
        point: { type: String, required: true },
        weight: { type: Number, required: true },
      }],
      required: function(this: IQuestionDocument) {
        return this.type === 'THEORY' && !this.hasSubParts && (!this.subParts || this.subParts.length === 0);
      },
      validate: [
        function(this: IQuestionDocument, val: any[]) {
          if (this.type !== 'THEORY') return true;
          if (this.hasSubParts || (this.subParts && this.subParts.length > 0)) return true;
          return val && val.length > 0;
        },
        'A theory question must have at least 1 rubric point'
      ]
    },
    eloRating: {
      type: Number,
      required: true,
      default: 1000,
      min: 0,
    },
    timesAnswered: {
      type: Number,
      default: 0,
    },
    timesCorrect: {
      type: Number,
      default: 0,
    },
    exposureCount: {
      type: Number,
      default: 0,
    },
    explanation: {
      type: String,
      default: 'See model answer and rubric criteria.',
    },
    explanationSource: {
      type: String,
      enum: ['manual', 'ai'],
      default: 'manual',
    },
  },
  {
    timestamps: true,
  }
);

QuestionSchema.index({ topicId: 1, eloRating: 1 });
// Compound index for fast cursor pagination and filtering by topic
QuestionSchema.index({ topicId: 1, _id: -1 });

export const Question = model<IQuestionDocument>('Question', QuestionSchema);
