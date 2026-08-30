import { Request, Response } from "express";
import { pool } from "../config/db.js";

/**
 * GET /dashboard/summary
 * Returns everything the Dashboard page needs in one call:
 *  - stats: income/expenses/net for the current calendar month, with
 *           deltas vs last month, plus a live count of budgets on track
 *  - trend: income vs expense totals for the last 6 calendar months
 *  - topCategories: top 5 expense categories this month by amount spent
 * All figures are computed on demand from transactions/budgets — nothing
 * is persisted or cached, consistent with the Budgets and Reports approach.
 */
export async function getDashboardSummary(req: Request, res: Response) {
  const workspaceId = req.workspaceId!;

  try {
    const [statsResult, budgetsOnTrackResult, trendResult, topCategoriesResult] =
      await Promise.all([
        // ---- Stats: this month vs last month ----
        pool.query(
          `SELECT
             COALESCE(SUM(amount) FILTER (
               WHERE type = 'income'
               AND transaction_date >= date_trunc('month', CURRENT_DATE)
               AND transaction_date < date_trunc('month', CURRENT_DATE) + interval '1 month'
             ), 0)::numeric(14,2) AS income_this_month,
             COALESCE(SUM(amount) FILTER (
               WHERE type = 'expense'
               AND transaction_date >= date_trunc('month', CURRENT_DATE)
               AND transaction_date < date_trunc('month', CURRENT_DATE) + interval '1 month'
             ), 0)::numeric(14,2) AS expenses_this_month,
             COALESCE(SUM(amount) FILTER (
               WHERE type = 'income'
               AND transaction_date >= date_trunc('month', CURRENT_DATE) - interval '1 month'
               AND transaction_date < date_trunc('month', CURRENT_DATE)
             ), 0)::numeric(14,2) AS income_last_month,
             COALESCE(SUM(amount) FILTER (
               WHERE type = 'expense'
               AND transaction_date >= date_trunc('month', CURRENT_DATE) - interval '1 month'
               AND transaction_date < date_trunc('month', CURRENT_DATE)
             ), 0)::numeric(14,2) AS expenses_last_month
           FROM transactions
           WHERE workspace_id = $1 AND deleted_at IS NULL`,
          [workspaceId]
        ),

        // ---- Budgets on track: all active budgets, each vs its own period ----
        pool.query(
          `SELECT
             COUNT(*)::int AS total_active,
             COUNT(*) FILTER (WHERE COALESCE(spent.total, 0) < b.limit_amount)::int AS on_track
           FROM budgets b
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
           ) ps
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
           WHERE b.workspace_id = $1 AND b.is_active = true`,
          [workspaceId]
        ),

        // ---- Trend: last 6 calendar months, income vs expense ----
        pool.query(
          `SELECT
             to_char(month_start, 'Mon') AS month_label,
             month_start,
             COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'income'), 0)::numeric(14,2) AS income,
             COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'expense'), 0)::numeric(14,2) AS expenses
           FROM generate_series(
             date_trunc('month', CURRENT_DATE) - interval '5 months',
             date_trunc('month', CURRENT_DATE),
             interval '1 month'
           ) AS month_start
           LEFT JOIN transactions t
             ON t.workspace_id = $1
             AND t.deleted_at IS NULL
             AND t.transaction_date >= month_start
             AND t.transaction_date < month_start + interval '1 month'
           GROUP BY month_start
           ORDER BY month_start ASC`,
          [workspaceId]
        ),

        // ---- Top 5 expense categories this month ----
        pool.query(
          `SELECT
             c.id AS category_id, c.name, c.color, c.icon,
             SUM(t.amount)::numeric(14,2) AS total
           FROM transactions t
           JOIN categories c ON c.id = t.category_id
           WHERE t.workspace_id = $1
             AND t.deleted_at IS NULL
             AND t.type = 'expense'
             AND t.transaction_date >= date_trunc('month', CURRENT_DATE)
             AND t.transaction_date < date_trunc('month', CURRENT_DATE) + interval '1 month'
           GROUP BY c.id, c.name, c.color, c.icon
           ORDER BY total DESC
           LIMIT 5`,
          [workspaceId]
        ),
      ]);

    const s = statsResult.rows[0];
    const incomeThisMonth = Number(s.income_this_month);
    const expensesThisMonth = Number(s.expenses_this_month);
    const incomeLastMonth = Number(s.income_last_month);
    const expensesLastMonth = Number(s.expenses_last_month);
    const netSaved = incomeThisMonth - expensesThisMonth;

    function pctDelta(current: number, previous: number): number | null {
      if (previous === 0) return null; // avoid divide-by-zero; frontend can show "—"
      return Math.round(((current - previous) / previous) * 1000) / 10; // 1 decimal
    }

    const budgetsRow = budgetsOnTrackResult.rows[0];

    return res.json({
      stats: {
        income: incomeThisMonth,
        incomeDeltaPct: pctDelta(incomeThisMonth, incomeLastMonth),
        expenses: expensesThisMonth,
        expensesDeltaPct: pctDelta(expensesThisMonth, expensesLastMonth),
        netSaved,
        netSavedPctOfIncome: incomeThisMonth > 0
          ? Math.round((netSaved / incomeThisMonth) * 1000) / 10
          : null,
        budgetsOnTrack: budgetsRow.on_track,
        budgetsTotal: budgetsRow.total_active,
      },
      trend: trendResult.rows.map((r) => ({
        month: r.month_label,
        income: Number(r.income),
        expenses: Number(r.expenses),
      })),
      topCategories: topCategoriesResult.rows.map((r) => ({
        categoryId: r.category_id,
        name: r.name,
        color: r.color,
        icon: r.icon,
        total: Number(r.total),
      })),
    });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    return res.status(500).json({ error: "Something went wrong fetching the dashboard" });
  }
}