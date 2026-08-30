import { z } from "zod";

export const exportQuerySchema = z
  .object({
    type: z.enum(["csv", "pdf", "summary-csv"]),
    from: z.string().date().optional(),
    to: z.string().date().optional(),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: "'from' must be on or before 'to'",
    path: ["from"],
  });