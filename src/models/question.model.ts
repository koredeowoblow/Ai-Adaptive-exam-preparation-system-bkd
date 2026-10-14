import { Schema, model } from 'mongoose';
import { IQuestionDocument } from '../types/question.types';

const QuestionOptionSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, trim: true },
  },
  { _id: false } // No need for separate ObjectIds for embedded options
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
      required: function(this: IQuestionDocument) { return this.type === 'THEORY'; },
    },
    rubric: {
      type: [{
        point: { type: String, required: true },
        weight: { type: Number, required: true, min: 0, max: 1 },
      }],
      required: function(this: IQuestionDocument) { return this.type === 'THEORY'; },
      validate: [
        function(this: IQuestionDocument, val: any[]) {
          if (this.type !== 'THEORY') return true;
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
      required: true,
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
