import { z } from 'zod';

export const createCourseSchema = z.object({
  body: z.object({
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format'),
    code: z.string().min(2, 'Course code must be at least 2 characters'),
    title: z.string().min(2, 'Course title must be at least 2 characters'),
    description: z.string().optional(),
  }),
});

export const updateCourseSchema = z.object({
  body: z.object({
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format').optional(),
    code: z.string().min(2, 'Course code must be at least 2 characters').optional(),
    title: z.string().min(2, 'Course title must be at least 2 characters').optional(),
    description: z.string().optional(),
  }),
});
