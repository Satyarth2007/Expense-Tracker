/**
 * Parses common bank-export date formats into YYYY-MM-DD.
 * Returns null if the format isn't recognized — callers should skip
 * (not crash on) unparseable rows and let the user notice the count.
 */
export function parseFlexibleDate(raw: string): string | null {
  const trimmed = raw.trim();

  let m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  // DD/MM/YYYY or DD-MM-YYYY (standard Indian bank export format)
  m = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    return `${m[3]}-${month}-${day}`;
  }

  return null;
}