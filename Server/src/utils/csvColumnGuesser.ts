import type { ColumnMapping } from "../types/import.js";

const DATE_HINTS = ["date", "txn date", "transaction date", "value date"];
const DESCRIPTION_HINTS = ["description", "narration", "details", "particulars", "remarks"];
const DEBIT_HINTS = ["debit", "withdrawal", "withdrawal amt", "dr"];
const CREDIT_HINTS = ["credit", "deposit", "deposit amt", "cr"];
const AMOUNT_HINTS = ["amount", "amt", "transaction amount"];

function findBestMatch(headers: string[], hints: string[]): string | undefined {
  const normalized = headers.map((h) => ({ original: h, lower: h.trim().toLowerCase() }));
  for (const hint of hints) {
    const exact = normalized.find((h) => h.lower === hint);
    if (exact) return exact.original;
  }
  for (const hint of hints) {
    const partial = normalized.find((h) => h.lower.includes(hint));
    if (partial) return partial.original;
  }
  return undefined;
}

/**
 * Best-effort guess at which CSV columns map to date/description/amount,
 * based on common header naming patterns. Always returned to the user for
 * confirmation before anything is parsed for real — never trusted blindly.
 */
export function guessColumnMapping(headers: string[]): Partial<ColumnMapping> {
  const dateColumn = findBestMatch(headers, DATE_HINTS);
  const descriptionColumn = findBestMatch(headers, DESCRIPTION_HINTS);
  const debitColumn = findBestMatch(headers, DEBIT_HINTS);
  const creditColumn = findBestMatch(headers, CREDIT_HINTS);
  const amountColumn = debitColumn || creditColumn ? undefined : findBestMatch(headers, AMOUNT_HINTS);

  return { dateColumn, descriptionColumn, debitColumn, creditColumn, amountColumn };
}