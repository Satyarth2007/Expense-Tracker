import type { RecurringFrequency } from "../types/recurring.js";

/**
 * Advances a date forward by one occurrence of the given frequency.
 * Pure date math, no DB access — reused by both createRecurringRule
 * (to seed next_run_date) and the BullMQ worker (to advance it after
 * each automatic post).
 */
export function advanceDate(date: Date, frequency: RecurringFrequency): Date {
  const next = new Date(date);
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}