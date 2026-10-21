import { z } from 'zod';
import { validateExamDate } from '../utils/dateValidation';

const examDateSchema = z
  .string()
  .nullable()
  .optional()
  .refine(
    (val) => {
      const res = validateExamDate(val);
      return res.isValid;
    },
    { message: 'Invalid exam date: must be YYYY-MM-DD, cannot be in the past, and within 24 months' }
  );

export const updateStudentProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format').optional(),
    level: z.enum(['100L', '200L', '300L', '400L', '500L']).optional(),
    nextExamDate: examDateSchema,
    enrolledCourseIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID format')).optional(),
    isOnboarded: z.boolean().optional(),
  }),
});

export const completeOnboardingSchema = z.object({
  body: z.object({
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format').optional(),
    level: z.enum(['100L', '200L', '300L', '400L', '500L']).optional(),
    nextExamDate: examDateSchema,
    courseIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID format')).optional(),
  }),
});

export const enrollCoursesSchema = z.object({
  body: z.object({
    courseIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID format')).min(1).optional(),
  }),
});

export const promoteStudentSchema = z.object({
  body: z.object({
    targetLevel: z.enum(['100L', '200L', '300L', '400L', '500L']),
    courseIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID format')).optional(),
    nextExamDate: examDateSchema,
  }),
});

export const updateCourseExamDatesSchema = z.object({
  body: z.union([
    z.object({
      courseExamDates: z.record(z.string(), z.string()),
    }),
    z.record(z.string(), z.string()),
  ]),
});

