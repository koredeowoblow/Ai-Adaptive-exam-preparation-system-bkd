import { z } from 'zod';

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Department name must be at least 2 characters'),
    description: z.string().optional(),
    createdBy: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid createdBy ID format').optional(),
  }),
});

export const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Department name must be at least 2 characters').optional(),
    description: z.string().optional(),
  }),
});
