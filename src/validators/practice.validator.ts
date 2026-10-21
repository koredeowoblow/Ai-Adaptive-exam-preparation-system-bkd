import { z } from 'zod';

export const startSessionSchema = z.object({
  body: z.object({
    courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID format'),
    totalQuestions: z.number().int().min(1).max(100).optional(),
    questionCount: z.number().int().min(1).max(100).optional(),
    questionType: z.enum(['MIXED', 'OBJECTIVE_ONLY', 'THEORY_ONLY']).optional(),
    mode: z.enum(['quick', 'mock', 'diagnostic']).optional(),
  }),
});

const subPartAnswerSubmissionSchema = z.object({
  partId: z.string().min(1),
  label: z.string().optional(),
  writtenAnswer: z.string(),
});

export const submitBatchAnswersSchema = z.object({
  body: z.object({
    answers: z.array(
      z.object({
        questionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid question ID format'),
        selectedAnswer: z.string().optional(),
        writtenAnswer: z.string().optional(),
        subPartAnswers: z.array(subPartAnswerSubmissionSchema).optional(),
        timeTaken: z.number().int().min(0).optional(),
      })
    ),
  }),
});

export const logAntiCheatEventsSchema = z.object({
  body: z.object({
    events: z.array(
      z.object({
        type: z.enum(['TAB_SWITCH', 'PASTE_DETECTED', 'FAST_ANSWER', 'DEVTOOLS_DETECTED', 'RIGHT_CLICK_BLOCKED']),
        questionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid question ID format').optional(),
        timestamp: z.string().datetime().or(z.date()),
        metadata: z.any().optional(),
      })
    ),
  }),
});
