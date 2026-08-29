import { z } from 'zod';

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

export const createTransactionSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  merchant: z.string().max(255).nullable().optional(),
  amount: z.number().positive("Amount must be greater than 0"),
  type: z.enum(['income', 'expense', 'transfer']).default('expense'),
  description: z.string().max(500).nullable().optional(),
  transactionDate: dateStringSchema,
});

export const updateTransactionSchema = z
  .object({
    categoryId: z.string().uuid().nullable().optional(),
    merchant: z.string().max(255).nullable().optional(),
    amount: z.number().positive("Amount must be greater than 0").optional(),
    type: z.enum(['income', 'expense', 'transfer']).optional(),
    description: z.string().max(500).nullable().optional(),
    transactionDate: dateStringSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const listTransactionsQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  search: z.string().max(255).optional(),
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});