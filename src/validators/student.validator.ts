import { z } from 'zod';

export const updateStudentProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format').optional(),
    level: z.enum(['100L', '200L', '300L', '400L', '500L']).optional(),
    nextExamDate: z.string().nullable().optional(),
    enrolledCourseIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID format')).optional(),
    isOnboarded: z.boolean().optional(),
  }),
});

export const completeOnboardingSchema = z.object({
  body: z.object({
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format').optional(),
    level: z.enum(['100L', '200L', '300L', '400L', '500L']).optional(),
    nextExamDate: z.string().nullable().optional(),
    courseIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID format')).optional(),
  }),
});

export const enrollCoursesSchema = z.object({
  body: z.object({
    courseIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID format')).min(1).optional(),
  }),
});

