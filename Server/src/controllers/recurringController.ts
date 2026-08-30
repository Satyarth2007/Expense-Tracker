import { Request, Response } from "express";
import { pool } from "../config/db.js";
import {
  createRecurringRuleSchema,
  updateRecurringRuleSchema,
} from "../validators/recurringValidators.js";
import { advanceDate } from "../utils/recurringDates.js";

/**
 * GET /recurring
 * Lists recurring rules in the caller's workspace.
 */
export async function listRecurringRules(req: Request, res: Response) {
  const workspaceId = req.workspaceId!;

  try {
    const result = await pool.query(
      `SELECT r.id, r.category_id, c.name AS category_name, c.color AS category_color,
              c.icon AS category_icon, r.name, r.amount, r.currency, r.frequency,
              r.start_date, r.end_date, r.next_run_date, r.last_run_date,
              r.is_active, r.created_at, r.updated_at
       FROM recurring_rules r
       LEFT JOIN categories c ON c.id = r.category_id
       WHERE r.workspace_id = $1
       ORDER BY r.next_run_date ASC`,
      [workspaceId]
    );
    return res.json({ recurringRules: result.rows });
  } catch (err) {
    console.error("List recurring rules error:", err);
    return res.status(500).json({ error: "Something went wrong fetching recurring rules" });
  }
}

/**
 * POST /recurring
 * Creates a recurring rule. next_run_date is seeded from startDate — if
 * startDate is today or in the future, the first automatic post happens
 * on that date; if startDate is in the past, next_run_date is advanced
 * forward until it's today or later, so it doesn't try to "catch up" on
 * every missed occurrence at once.
 */
export async function createRecurringRule(req: Request, res: Response) {
  const parsed = createRecurringRuleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const workspaceId = req.workspaceId!;
  const { categoryId, name, amount, frequency, startDate, endDate } = parsed.data;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (categoryId) {
      const categoryCheck = await client.query(
        "SELECT id FROM categories WHERE id = $1 AND workspace_id = $2",
        [categoryId, workspaceId]
      );
      if (categoryCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Category not found in this workspace" });
      }
    }

    // Seed next_run_date: advance from startDate until it's today or later
    let nextRunDate = new Date(startDate + "T00:00:00Z");
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    while (nextRunDate < today) {
      nextRunDate = advanceDate(nextRunDate, frequency);
    }
    const nextRunDateStr = nextRunDate.toISOString().slice(0, 10);

    const result = await client.query(
      `INSERT INTO recurring_rules
         (workspace_id, category_id, name, amount, currency, frequency,
          start_date, end_date, next_run_date)
       VALUES ($1, $2, $3, $4, 'INR', $5, $6, $7, $8)
       RETURNING id, category_id, name, amount, currency, frequency,
                 start_date, end_date, next_run_date, last_run_date,
                 is_active, created_at, updated_at`,
      [workspaceId, categoryId ?? null, name, amount, frequency, startDate, endDate ?? null, nextRunDateStr]
    );

    await client.query("COMMIT");
    return res.status(201).json({ recurringRule: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create recurring rule error:", err);
    return res.status(500).json({ error: "Something went wrong creating the recurring rule" });
  } finally {
    client.release();
  }
}

/**
 * PATCH /recurring/:id
 * Updates a recurring rule. If frequency or startDate changes, next_run_date
 * is NOT automatically recalculated here — that's a deliberate choice to
 * avoid silently shifting a rule the user didn't ask to reschedule. Use the
 * dedicated reschedule flow if you want that later; for now, changing
 * frequency only affects the NEXT advance after the upcoming run.
 */
export async function updateRecurringRule(req: Request, res: Response) {
  const { id } = req.params;
  const parsed = updateRecurringRuleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const workspaceId = req.workspaceId!;
  const fields = parsed.data;

  const columnMap: Record<string, string> = {
    categoryId: "category_id",
    name: "name",
    amount: "amount",
    frequency: "frequency",
    startDate: "start_date",
    endDate: "end_date",
    isActive: "is_active",
  };

  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, column] of Object.entries(columnMap)) {
    if (key in fields) {
      setClauses.push(`${column} = $${paramIndex}`);
      values.push((fields as any)[key]);
      paramIndex++;
    }
  }

  values.push(id, workspaceId);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (fields.categoryId) {
      const categoryCheck = await client.query(
        "SELECT id FROM categories WHERE id = $1 AND workspace_id = $2",
        [fields.categoryId, workspaceId]
      );
      if (categoryCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Category not found in this workspace" });
      }
    }

    const result = await client.query(
      `UPDATE recurring_rules
       SET ${setClauses.join(", ")}
       WHERE id = $${paramIndex} AND workspace_id = $${paramIndex + 1}
       RETURNING id, category_id, name, amount, currency, frequency,
                 start_date, end_date, next_run_date, last_run_date,
                 is_active, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Recurring rule not found" });
    }

    await client.query("COMMIT");
    return res.json({ recurringRule: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Update recurring rule error:", err);
    return res.status(500).json({ error: "Something went wrong updating the recurring rule" });
  } finally {
    client.release();
  }
}

/**
 * DELETE /recurring/:id
 * Hard delete. Unlike Budgets/Transactions, a recurring rule with no
 * transaction history of its own (the transactions it created live
 * independently in the transactions table) has nothing to preserve by
 * soft-deleting — the created transactions aren't touched either way.
 */
export async function deleteRecurringRule(req: Request, res: Response) {
  const { id } = req.params;
  const workspaceId = req.workspaceId!;

  try {
    const result = await pool.query(
      "DELETE FROM recurring_rules WHERE id = $1 AND workspace_id = $2 RETURNING id",
      [id, workspaceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Recurring rule not found" });
    }

    return res.status(200).json({ message: "Recurring rule deleted successfully" });
  } catch (err) {
    console.error("Delete recurring rule error:", err);
    return res.status(500).json({ error: "Something went wrong deleting the recurring rule" });
  }
}