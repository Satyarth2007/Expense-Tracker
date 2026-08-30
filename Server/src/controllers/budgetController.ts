import { Request, Response } from "express";
import { pool } from "../config/db.js";
import {
  createBudgetSchema,
  updateBudgetSchema,
  listBudgetsQuerySchema,
} from "../validators/budgetValidators.js";

/**
 * GET /budgets
 * Lists budgets in the caller's workspace, each annotated with spent_amount,
 * remaining_amount, and percent_used — computed live against transactions
 * for the budget's current period. No spend data is persisted on the row.
 */
export async function listBudgets(req: Request, res: Response) {
  const parsed = listBudgetsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const workspaceId = req.workspaceId!;
  const { includeInactive } = parsed.data;

  const activeClause = includeInactive ? "" : "AND b.is_active = true";

  try {
    const result = await pool.query(
      `SELECT
         b.id, b.category_id, c.name AS category_name, c.color AS category_color,
         c.icon AS category_icon, b.limit_amount, b.period, b.alert_threshold_pct,
         b.is_active, b.created_at, b.updated_at,
         ps.period_start, ps.period_end,
         COALESCE(spent.total, 0)::numeric(14,2) AS spent_amount,
         GREATEST(b.limit_amount - COALESCE(spent.total, 0), 0)::numeric(14,2) AS remaining_amount,
         LEAST(ROUND((COALESCE(spent.total, 0) / b.limit_amount) * 100), 999)::int AS percent_used
       FROM budgets b
       JOIN categories c ON c.id = b.category_id
       CROSS JOIN LATERAL (
         SELECT
           CASE b.period
             WHEN 'weekly'    THEN date_trunc('week', CURRENT_DATE)
             WHEN 'monthly'   THEN date_trunc('month', CURRENT_DATE)
             WHEN 'quarterly' THEN date_trunc('quarter', CURRENT_DATE)
             WHEN 'yearly'    THEN date_trunc('year', CURRENT_DATE)
           END AS period_start,
           CASE b.period
             WHEN 'weekly'    THEN date_trunc('week', CURRENT_DATE) + interval '7 days'
             WHEN 'monthly'   THEN date_trunc('month', CURRENT_DATE) + interval '1 month'
             WHEN 'quarterly' THEN date_trunc('quarter', CURRENT_DATE) + interval '3 months'
             WHEN 'yearly'    THEN date_trunc('year', CURRENT_DATE) + interval '1 year'
           END AS period_end
       ) ps ON true
       LEFT JOIN LATERAL (
         SELECT SUM(t.amount) AS total
         FROM transactions t
         WHERE t.workspace_id = b.workspace_id
           AND t.category_id = b.category_id
           AND t.deleted_at IS NULL
           AND t.type = 'expense'
           AND t.transaction_date >= ps.period_start
           AND t.transaction_date < ps.period_end
       ) spent ON true
       WHERE b.workspace_id = $1 ${activeClause}
       ORDER BY c.name ASC`,
      [workspaceId]
    );
    return res.json({ budgets: result.rows });
  } catch (err) {
    console.error("List budgets error:", err);
    return res.status(500).json({ error: "Something went wrong fetching budgets" });
  }
}

/**
 * POST /budgets
 * Creates a budget ceiling for a category. Rejects duplicate active
 * budgets for the same category+period via the partial unique index.
 */
export async function createBudget(req: Request, res: Response) {
  const parsed = createBudgetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const workspaceId = req.workspaceId!;
  const { categoryId, limitAmount, period, alertThresholdPct } = parsed.data;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const categoryCheck = await client.query(
      "SELECT id FROM categories WHERE id = $1 AND workspace_id = $2",
      [categoryId, workspaceId]
    );
    if (categoryCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Category not found in this workspace" });
    }

    const result = await client.query(
      `INSERT INTO budgets (workspace_id, category_id, limit_amount, period, alert_threshold_pct)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, category_id, limit_amount, period, alert_threshold_pct, is_active, created_at, updated_at`,
      [workspaceId, categoryId, limitAmount, period, alertThresholdPct]
    );

    await client.query("COMMIT");
    return res.status(201).json({ budget: result.rows[0] });
  } catch (err: any) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      // idx_budgets_unique_active_category_period violation
      return res.status(409).json({ error: "An active budget already exists for this category and period" });
    }
    console.error("Create budget error:", err);
    return res.status(500).json({ error: "Something went wrong creating the budget" });
  } finally {
    client.release();
  }
}

/**
 * PATCH /budgets/:id
 * Updates a budget. Only fields present in the body are changed.
 */
export async function updateBudget(req: Request, res: Response) {
  const { id } = req.params;
  const parsed = updateBudgetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const workspaceId = req.workspaceId!;
  const fields = parsed.data;

  const columnMap: Record<string, string> = {
    categoryId: "category_id",
    limitAmount: "limit_amount",
    period: "period",
    alertThresholdPct: "alert_threshold_pct",
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
      `UPDATE budgets
       SET ${setClauses.join(", ")}
       WHERE id = $${paramIndex} AND workspace_id = $${paramIndex + 1}
       RETURNING id, category_id, limit_amount, period, alert_threshold_pct, is_active, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Budget not found" });
    }

    await client.query("COMMIT");
    return res.json({ budget: result.rows[0] });
  } catch (err: any) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      return res.status(409).json({ error: "An active budget already exists for this category and period" });
    }
    console.error("Update budget error:", err);
    return res.status(500).json({ error: "Something went wrong updating the budget" });
  } finally {
    client.release();
  }
}

/**
 * DELETE /budgets/:id
 * Soft-deactivates a budget (is_active = false) rather than deleting the row,
 * so budget history is preserved and the category can get a fresh active
 * budget later without conflicting with the partial unique index.
 */
export async function deleteBudget(req: Request, res: Response) {
  const { id } = req.params;
  const workspaceId = req.workspaceId!;

  try {
    const result = await pool.query(
      `UPDATE budgets
       SET is_active = false
       WHERE id = $1 AND workspace_id = $2 AND is_active = true
       RETURNING id`,
      [id, workspaceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Budget not found" });
    }

    return res.status(200).json({ message: "Budget deactivated successfully" });
  } catch (err) {
    console.error("Delete budget error:", err);
    return res.status(500).json({ error: "Something went wrong deleting the budget" });
  }
}