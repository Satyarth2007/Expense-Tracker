import { Request, Response } from "express";
import { Parser as CsvParser } from "json2csv";
import PDFDocument from "pdfkit";
import { pool } from "../config/db.js";
import { exportQuerySchema } from "../validators/reportValidators.js";
import { resolveDateRange } from "../utils/reportDateRange.js";

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * GET /reports/export?type=csv|pdf|summary-csv&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Streams the requested export directly in the response — nothing is
 * written to disk or persisted. Report data is computed on demand from
 * transactions/categories, same "compute, don't store" approach used by
 * Budgets and Dashboard.
 */
export async function exportReport(req: Request, res: Response) {
  const parsed = exportQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const workspaceId = req.workspaceId!;
  const { type, from: rawFrom, to: rawTo } = parsed.data;
  const { from, to } = resolveDateRange(rawFrom, rawTo);

  try {
    if (type === "csv") {
      return await exportRawCsv(req, res, workspaceId, from, to);
    }
    if (type === "summary-csv") {
      return await exportSummaryCsv(req, res, workspaceId, from, to);
    }
    return await exportPdfStatement(req, res, workspaceId, from, to);
  } catch (err) {
    console.error("Export report error:", err);
    return res.status(500).json({ error: "Something went wrong generating the report" });
  }
}

/**
 * Raw ledger export — every transaction in range, one row each.
 */
async function exportRawCsv(
  _req: Request,
  res: Response,
  workspaceId: string,
  from: string,
  to: string
) {
  const result = await pool.query(
    `SELECT t.transaction_date, t.merchant, t.description, c.name AS category_name,
            t.type, t.amount
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.workspace_id = $1
       AND t.deleted_at IS NULL
       AND t.transaction_date >= $2
       AND t.transaction_date <= $3
     ORDER BY t.transaction_date ASC, t.created_at ASC`,
    [workspaceId, from, to]
  );

  const rows = result.rows.map((r) => ({
    date: r.transaction_date.toISOString().slice(0, 10),
    merchant: r.merchant ?? "",
    description: r.description ?? "",
    category: r.category_name ?? "Uncategorized",
    type: r.type,
    amount: Number(r.amount).toFixed(2),
  }));

  const csvParser = new CsvParser({
    fields: ["date", "merchant", "description", "category", "type", "amount"],
  });
  const csv =
    rows.length > 0 ? csvParser.parse(rows) : "date,merchant,description,category,type,amount\n";

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="ledger-${from}-to-${to}.csv"`);
  return res.status(200).send(csv);
}

/**
 * Category summary — totals per category in range, income and expense
 * separated. Shared aggregation used by both summary-csv and the PDF.
 */
async function getCategorySummary(workspaceId: string, from: string, to: string) {
  const totalsResult = await pool.query(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)::numeric(14,2) AS total_income,
       COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)::numeric(14,2) AS total_expenses
     FROM transactions
     WHERE workspace_id = $1 AND deleted_at IS NULL
       AND transaction_date >= $2 AND transaction_date <= $3`,
    [workspaceId, from, to]
  );

  const categoryResult = await pool.query(
    `SELECT c.name AS category_name, t.type, SUM(t.amount)::numeric(14,2) AS total
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.workspace_id = $1 AND t.deleted_at IS NULL
       AND t.transaction_date >= $2 AND t.transaction_date <= $3
     GROUP BY c.name, t.type
     ORDER BY total DESC`,
    [workspaceId, from, to]
  );

  const totalIncome = Number(totalsResult.rows[0].total_income);
  const totalExpenses = Number(totalsResult.rows[0].total_expenses);

  return {
    totalIncome,
    totalExpenses,
    net: totalIncome - totalExpenses,
    categories: categoryResult.rows.map((r) => ({
      name: r.category_name,
      type: r.type as "income" | "expense",
      total: Number(r.total),
    })),
  };
}

async function exportSummaryCsv(
  _req: Request,
  res: Response,
  workspaceId: string,
  from: string,
  to: string
) {
  const summary = await getCategorySummary(workspaceId, from, to);

  const rows: { category: string; type: string; total: string }[] = summary.categories.map((c) => ({
    category: c.name,
    type: c.type,
    total: c.total.toFixed(2),
  }));
  rows.push({ category: "TOTAL INCOME", type: "income", total: summary.totalIncome.toFixed(2) });
  rows.push({ category: "TOTAL EXPENSES", type: "expense", total: summary.totalExpenses.toFixed(2) });
  rows.push({ category: "NET", type: "", total: summary.net.toFixed(2) });

  const csvParser = new CsvParser({ fields: ["category", "type", "total"] });
  const csv = csvParser.parse(rows);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="summary-${from}-to-${to}.csv"`);
  return res.status(200).send(csv);
}

/**
 * Formatted PDF statement — totals + category breakdown, not a full
 * transaction listing, matching the mockup's "clean printable summary".
 */
async function exportPdfStatement(
  _req: Request,
  res: Response,
  workspaceId: string,
  from: string,
  to: string
) {
  const summary = await getCategorySummary(workspaceId, from, to);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="statement-${from}-to-${to}.pdf"`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).text("Ledger — Statement", { align: "left" });
  doc.fontSize(11).fillColor("#6B5F4C").text(`${from} to ${to}`);
  doc.moveDown(1.5);

  doc.fontSize(13).fillColor("#221F1A").text("Summary");
  doc.moveDown(0.5);
  doc
    .fontSize(11)
    .text(`Total income:    ${formatINR(summary.totalIncome)}`)
    .text(`Total expenses:  ${formatINR(summary.totalExpenses)}`)
    .fontSize(12)
    .text(`Net:             ${formatINR(summary.net)}`, { underline: true });

  doc.moveDown(1.5);
  doc.fontSize(13).text("By category");
  doc.moveDown(0.5);

  const expenseCategories = summary.categories.filter((c) => c.type === "expense");
  if (expenseCategories.length === 0) {
    doc.fontSize(11).fillColor("#6B5F4C").text("No expenses recorded in this period.");
  } else {
    for (const cat of expenseCategories) {
      doc
        .fontSize(11)
        .fillColor("#221F1A")
        .text(cat.name, { continued: true, width: 300 })
        .text(formatINR(cat.total), { align: "right" });
    }
  }

  doc.end();
}