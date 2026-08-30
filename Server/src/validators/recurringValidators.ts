import { z } from "zod";

export const recurringFrequencyEnum = z.enum([
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "yearly",
]);

export const createRecurringRuleSchema = z
  .object({
    categoryId: z.string().uuid().optional(),
    name: z.string().trim().min(1).max(150),
    amount: z.number().positive(),
    frequency: recurringFrequencyEnum,
    startDate: z.string().date(), // "YYYY-MM-DD"
    endDate: z.string().date().optional(),
  })
  .refine((obj) => !obj.endDate || obj.endDate >= obj.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export const updateRecurringRuleSchema = z
  .object({
    categoryId: z.string().uuid().nullable().optional(),
    name: z.string().trim().min(1).max(150).optional(),
    amount: z.number().positive().optional(),
    frequency: recurringFrequencyEnum.optional(),
    startDate: z.string().date().optional(),
    endDate: z.string().date().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field must be provided",
  });