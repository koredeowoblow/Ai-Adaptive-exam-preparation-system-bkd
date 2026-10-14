import { z } from 'zod';

const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

const rubricItemSchema = z.object({
  point: z.string().min(1, 'Rubric point text required'),
  weight: z.number().min(0).max(1),
});

export const createQuestionSchema = z.object({
  body: z
    .object({
      type: z.enum(['MULTIPLE_CHOICE', 'THEORY']).default('MULTIPLE_CHOICE').optional(),
      topicId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid topic ID format'),
      questionText: z.string().min(5, 'Question text must be at least 5 characters'),
      options: z.array(optionSchema).optional(),
      correctAnswer: z.string().optional(),
      modelAnswer: z.string().optional(),
      rubric: z.array(rubricItemSchema).optional(),
      difficulty: z.number().int().min(1).max(10).optional(),
      eloRating: z.number().optional(),
      explanation: z.string().min(5),
      explanationSource: z.enum(['manual', 'ai']).optional(),
    })
    .refine(
      (data) => {
        if (data.type === 'THEORY') {
          return !!data.modelAnswer && data.modelAnswer.trim().length > 0;
        }
        return Array.isArray(data.options) && data.options.length >= 2 && !!data.correctAnswer;
      },
      {
        message: 'Multiple choice requires at least 2 options and a correct answer; Theory requires a model answer',
        path: ['options'],
      }
    ),
});

export const updateQuestionSchema = z.object({
  body: z.object({
    type: z.enum(['MULTIPLE_CHOICE', 'THEORY']).optional(),
    questionText: z.string().min(5, 'Question text must be at least 5 characters').optional(),
    options: z.array(optionSchema).optional(),
    correctAnswer: z.string().optional(),
    modelAnswer: z.string().optional(),
    rubric: z.array(rubricItemSchema).optional(),
    difficulty: z.number().int().min(1).max(10).optional(),
    eloRating: z.number().optional(),
    explanation: z.string().min(5).optional(),
    explanationSource: z.enum(['manual', 'ai']).optional(),
  }),
});
