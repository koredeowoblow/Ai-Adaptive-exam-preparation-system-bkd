import { z } from 'zod';

export const createTopicSchema = z.object({
  body: z.object({
    courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID format'),
    name: z.string().min(2, 'Topic name must be at least 2 characters'),
    order: z.number().int().min(0).optional(),
  }),
});

export const updateTopicSchema = z.object({
  body: z.object({
    courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID format').optional(),
    name: z.string().min(2, 'Topic name must be at least 2 characters').optional(),
    order: z.number().int().min(0).optional(),
  }),
});
