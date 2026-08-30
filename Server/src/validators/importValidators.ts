import { z } from "zod";

export const columnMappingSchema = z
  .object({
    dateColumn: z.string().min(1),
    descriptionColumn: z.string().min(1),
    amountColumn: z.string().min(1).optional(),
    debitColumn: z.string().min(1).optional(),
    creditColumn: z.string().min(1).optional(),
    typeColumn: z.string().min(1).optional(),        // NEW
    debitValue: z.string().min(1).optional(),         // NEW — e.g. "Db"
    creditValue: z.string().min(1).optional(),        // NEW — e.g. "Cr"
  })
  .refine(
    (m) =>
      (m.debitColumn && m.creditColumn) ||               // mode A: separate columns
      (m.amountColumn && !m.typeColumn) ||                // mode B: signed amount
      (m.amountColumn && m.typeColumn && m.debitValue && m.creditValue), // mode C: amount + type
    {
      message:
        "Provide debit+credit columns, OR a signed amount column, OR an amount column with a type column and its debit/credit values",
    }
  );

export const updateStagedRowSchema = z
  .object({
    date: z.string().date().optional(),
    description: z.string().trim().min(1).optional(),
    amount: z.number().positive().optional(),
    type: z.enum(["income", "expense"]).optional(),
    categoryId: z.string().uuid().nullable().optional(),
    excluded: z.boolean().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field must be provided",
  });