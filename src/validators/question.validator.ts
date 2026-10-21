import { z } from 'zod';

const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

const rubricItemSchema = z.object({
  point: z.string().min(1, 'Rubric point text required'),
  weight: z.number().positive('Rubric weight must be greater than 0'),
});

const subPartItemSchema = z.object({
  id: z.string().min(1, 'Sub-part ID is required'),
  label: z.string().min(1, 'Sub-part label is required (e.g. 1(a), 1(b)(i))'),
  prompt: z.string().min(1, 'Sub-part prompt is required'),
  maxMarks: z.number().positive().optional(),
  modelAnswer: z.string().min(1, 'Sub-part model answer is required'),
  rubric: z.array(rubricItemSchema).min(1, 'Sub-part requires at least 1 rubric point'),
  diagramUrl: z.string().optional(),
  diagramCaption: z.string().optional(),
  order: z.number().int().optional(),
});

export const createQuestionSchema = z.object({
  body: z
    .object({
      type: z.enum(['MULTIPLE_CHOICE', 'THEORY']).default('MULTIPLE_CHOICE').optional(),
      topicId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid topic ID format'),
      questionText: z.string().min(5, 'Question text must be at least 5 characters'),
      diagramUrl: z.string().optional(),
      diagramCaption: z.string().optional(),
      hasSubParts: z.boolean().optional(),
      subParts: z.array(subPartItemSchema).optional(),
      options: z.array(optionSchema).optional(),
      correctAnswer: z.string().optional(),
      modelAnswer: z.string().optional(),
      rubric: z.array(rubricItemSchema).optional(),
      difficulty: z.number().int().min(1).max(10).optional(),
      eloRating: z.number().optional(),
      explanation: z.string().optional(),
      explanationSource: z.enum(['manual', 'ai']).optional(),
    })
    .refine(
      (data) => {
        if (data.type === 'THEORY') {
          if (data.hasSubParts || (Array.isArray(data.subParts) && data.subParts.length > 0)) {
            return Array.isArray(data.subParts) && data.subParts.length > 0;
          }
          return !!data.modelAnswer && data.modelAnswer.trim().length > 0;
        }
        return Array.isArray(data.options) && data.options.length >= 2 && !!data.correctAnswer;
      },
      {
        message: 'Multiple choice requires >=2 options and correctAnswer; Single-part Theory requires modelAnswer; Multi-part Theory requires subParts array',
        path: ['options'],
      }
    ),
});

export const updateQuestionSchema = z.object({
  body: z.object({
    type: z.enum(['MULTIPLE_CHOICE', 'THEORY']).optional(),
    questionText: z.string().min(5, 'Question text must be at least 5 characters').optional(),
    diagramUrl: z.string().optional(),
    diagramCaption: z.string().optional(),
    hasSubParts: z.boolean().optional(),
    subParts: z.array(subPartItemSchema).optional(),
    options: z.array(optionSchema).optional(),
    correctAnswer: z.string().optional(),
    modelAnswer: z.string().optional(),
    rubric: z.array(rubricItemSchema).optional(),
    difficulty: z.number().int().min(1).max(10).optional(),
    eloRating: z.number().optional(),
    explanation: z.string().optional(),
    explanationSource: z.enum(['manual', 'ai']).optional(),
  }),
});
