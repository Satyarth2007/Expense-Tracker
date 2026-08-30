import { z } from "zod";

export const budgetPeriodEnum = z.enum(["weekly", "monthly", "quarterly", "yearly"]);

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  limitAmount: z.number().positive(),
  period: budgetPeriodEnum.default("monthly"),
  alertThresholdPct: z.number().int().min(1).max(100).default(80),
});

export const updateBudgetSchema = z
  .object({
    categoryId: z.string().uuid().optional(),
    limitAmount: z.number().positive().optional(),
    period: budgetPeriodEnum.optional(),
    alertThresholdPct: z.number().int().min(1).max(100).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field must be provided",
  });

export const listBudgetsQuerySchema = z.object({
  includeInactive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true")
    .default(false),
});