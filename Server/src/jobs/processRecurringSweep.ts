import { pool } from "../config/db.js";
import { advanceDate } from "../utils/recurringDates.js";
import type { RecurringFrequency } from "../types/recurring.js";

interface DueRule {
  id: string;
  workspace_id: string;
  category_id: string | null;
  name: string;
  amount: string;
  frequency: RecurringFrequency;
  next_run_date: string;
  end_date: string | null;
}

/**
 * Finds every active rule due today or earlier, creates a transaction
 * for each, advances next_run_date, and deactivates rules that have
 * passed their end_date. Each rule runs in its own DB transaction so
 * one bad rule can't abort the whole sweep.
 */
export async function processRecurringSweep() {
  const dueRulesResult = await pool.query<DueRule>(
    `SELECT id, workspace_id, category_id, name, amount, frequency,
            next_run_date, end_date
     FROM recurring_rules
     WHERE is_active = true AND next_run_date <= CURRENT_DATE`
  );

  const dueRules = dueRulesResult.rows;
  console.log(`Recurring sweep: ${dueRules.length} rule(s) due`);

  let successCount = 0;
  let failCount = 0;

  for (const rule of dueRules) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `INSERT INTO transactions
           (workspace_id, category_id, merchant, amount, currency, amount_base,
            fx_rate_used, type, description, transaction_date, source)
         VALUES ($1, $2, $3, $4, 'INR', $4, NULL, 'expense', $5, $6, 'recurring')`,
        [
          rule.workspace_id,
          rule.category_id,
          rule.name,
          rule.amount,
          `Auto-posted from recurring rule: ${rule.name}`,
          rule.next_run_date,
        ]
      );

      const newNextRunDate = advanceDate(new Date(rule.next_run_date), rule.frequency);
      const newNextRunDateStr = newNextRunDate.toISOString().slice(0, 10);
      const isPastEnd = rule.end_date !== null && newNextRunDateStr > rule.end_date;

      await client.query(
        `UPDATE recurring_rules
         SET next_run_date = $1,
             last_run_date = $2,
             is_active = CASE WHEN $3 THEN false ELSE is_active END
         WHERE id = $4`,
        [newNextRunDateStr, rule.next_run_date, isPastEnd, rule.id]
      );

      await client.query("COMMIT");
      successCount++;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`Recurring sweep: failed to process rule ${rule.id} (${rule.name}):`, err);
      failCount++;
    } finally {
      client.release();
    }
  }

  console.log(`Recurring sweep complete: ${successCount} posted, ${failCount} failed`);
  return { total: dueRules.length, successCount, failCount };
}