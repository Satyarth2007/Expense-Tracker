import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(['income', 'expense']).default('expense'),
  parentId: z.string().uuid().nullable().optional(),
  color: z.string().max(20).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  isTaxDeductible: z.boolean().optional().default(false),
});

export const updateCategorySchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    type: z.enum(['income', 'expense']).optional(),
    parentId: z.string().uuid().nullable().optional(),
    color: z.string().max(20).nullable().optional(),
    icon: z.string().max(50).nullable().optional(),
    isTaxDeductible: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });