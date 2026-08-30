import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import csvParser from "csv-parser";
import { pool } from "../config/db.js";
import {
  saveImportSession,
  getImportSession,
  deleteImportSession,
} from "../utils/importRedis.js";
import { guessColumnMapping } from "../utils/csvColumnGuesser.js";
import { parseFlexibleDate } from "../utils/parseFlexibleDate.js";
import { columnMappingSchema, updateStagedRowSchema } from "../validators/importValidators.js";
import type {
  ImportSession,
  RawCsvRow,
  StagedImportRow,
  ColumnMapping,
} from "../types/import.js";

const MAX_ROWS = 10000;

/**
 * Express 5's types allow req.params values to be string | string[]
 * (to support repeated route segments). Our routes never use repeated
 * segments, so this just narrows back down to the plain string we
 * actually get at runtime.
 */
function asString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function parseCsvBuffer(buffer: Buffer): Promise<{ headers: string[]; rows: RawCsvRow[] }> {
  return new Promise((resolve, reject) => {
    const rows: RawCsvRow[] = [];
    let headers: string[] = [];

    Readable.from(buffer)
      .pipe(csvParser())
      .on("headers", (h: string[]) => {
        headers = h;
      })
      .on("data", (row: RawCsvRow) => {
        if (rows.length < MAX_ROWS) rows.push(row);
      })
      .on("end", () => resolve({ headers, rows }))
      .on("error", (err) => reject(err));
  });
}

/**
 * POST /import/upload
 * Parses the uploaded CSV's headers + rows, auto-guesses the column
 * mapping, and stages the RAW rows in Redis awaiting the user's confirmed
 * mapping. Nothing is written to transactions here — not even staged rows.
 */
export async function uploadImportFile(req: Request, res: Response) {
  const workspaceId = req.workspaceId!;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  if (!file.originalname.toLowerCase().endsWith(".csv")) {
    return res.status(400).json({ error: "Only CSV files are supported right now" });
  }

  try {
    const { headers, rows } = await parseCsvBuffer(file.buffer);

    if (rows.length === 0) {
      return res.status(400).json({ error: "The file has no data rows" });
    }
    if (rows.length >= MAX_ROWS) {
      return res.status(400).json({
        error: `This file has more than ${MAX_ROWS} rows — try a shorter date range`,
      });
    }

    const guessedMapping = guessColumnMapping(headers);
    const sessionId = randomUUID();

    const session: ImportSession = {
      workspaceId,
      sourceType: "csv",
      fileName: file.originalname,
      status: "mapping_pending",
      headers,
      rawRows: rows,
      mapping: null,
      stagedRows: [],
      createdAt: new Date().toISOString(),
    };

    await saveImportSession(workspaceId, sessionId, session);

    return res.status(201).json({
      sessionId,
      fileName: file.originalname,
      headers,
      guessedMapping,
      previewRows: rows.slice(0, 5),
      totalRows: rows.length,
    });
  } catch (err) {
    console.error("Import upload error:", err);
    return res.status(500).json({ error: "Could not parse this file" });
  }
}

/**
 * POST /import/:sessionId/confirm-mapping
 * Normalizes every raw row into a staged transaction shape using the
 * confirmed mapping, flags likely duplicates, and moves the session to
 * 'reviewing'. Rows that fail to parse (bad date, zero amount) are
 * silently skipped — skippedCount tells the user how many were dropped.
 */
export async function confirmMapping(req: Request, res: Response) {
  const sessionId = asString(req.params.sessionId);
  const workspaceId = req.workspaceId!;

  const parsed = columnMappingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const mapping = parsed.data as ColumnMapping;

  const session = await getImportSession(workspaceId, sessionId);
  if (!session || session.status !== "mapping_pending") {
    return res.status(404).json({ error: "Import session not found or already confirmed" });
  }

  const referencedColumns = [
  mapping.dateColumn,
  mapping.descriptionColumn,
  mapping.amountColumn,
  mapping.debitColumn,
  mapping.creditColumn,
  mapping.typeColumn,
].filter((c): c is string => !!c);
  const missing = referencedColumns.filter((c) => !session.headers.includes(c));
  if (missing.length > 0) {
    return res.status(400).json({ error: `Unknown column(s): ${missing.join(", ")}` });
  }

  // Cheap duplicate check: exact date + amount match against existing transactions
  const existingResult = await pool.query(
    `SELECT transaction_date, amount FROM transactions
     WHERE workspace_id = $1 AND deleted_at IS NULL`,
    [workspaceId]
  );
  const existingKeys = new Set(
    existingResult.rows.map(
      (r) => `${r.transaction_date.toISOString().slice(0, 10)}|${Number(r.amount)}`
    )
  );

  const totalRawRows = session.rawRows.length;
  const stagedRows: StagedImportRow[] = [];

  for (const raw of session.rawRows) {
    const rawDate = raw[mapping.dateColumn];
    const date = rawDate ? parseFlexibleDate(rawDate) : null;
    if (!date) continue;

    const description = (raw[mapping.descriptionColumn] ?? "").trim();

    let amount: number;
    let type: "income" | "expense";

    if (mapping.debitColumn && mapping.creditColumn) {
      // Mode A: separate debit/credit amount columns
      const debit = Number(raw[mapping.debitColumn] || 0);
      const credit = Number(raw[mapping.creditColumn] || 0);
      if (debit > 0) {
        amount = debit;
        type = "expense";
      } else if (credit > 0) {
        amount = credit;
        type = "income";
      } else {
        continue;
      }
    } else if (mapping.typeColumn && mapping.debitValue && mapping.creditValue) {
      // Mode C: single amount column + a type-indicator column (e.g. Db/Cr)
      const rawAmount = Number(raw[mapping.amountColumn!]);
      if (!Number.isFinite(rawAmount) || rawAmount === 0) continue;

      const rawType = (raw[mapping.typeColumn] ?? "").trim();
      if (rawType === mapping.debitValue) {
        amount = Math.abs(rawAmount);
        type = "expense";
      } else if (rawType === mapping.creditValue) {
        amount = Math.abs(rawAmount);
        type = "income";
      } else {
        continue; // unrecognized type value — skip rather than guess
      }
    } else if (mapping.amountColumn) {
      // Mode B: single signed amount column
      const rawAmount = Number(raw[mapping.amountColumn]);
      if (!Number.isFinite(rawAmount) || rawAmount === 0) continue;
      amount = Math.abs(rawAmount);
      type = rawAmount < 0 ? "expense" : "income";
    } else {
      continue;
    }

    stagedRows.push({
      id: randomUUID(),
      date,
      description: description || "Imported transaction",
      amount,
      type,
      categoryId: null,
      excluded: false,
      possibleDuplicate: existingKeys.has(`${date}|${amount}`),
      rawSource: raw,
    });
  }

  session.status = "reviewing";
  session.mapping = mapping;
  session.stagedRows = stagedRows;
  session.rawRows = []; // no longer needed — keep the Redis payload smaller

  await saveImportSession(workspaceId, sessionId, session);

  return res.json({
    sessionId,
    stagedRows,
    skippedCount: totalRawRows - stagedRows.length,
  });
}

/**
 * GET /import/:sessionId
 * Fetches the current state of an import session — used by the review
 * screen, including on page refresh.
 */
export async function getImportSessionHandler(req: Request, res: Response) {
  const sessionId = asString(req.params.sessionId);
  const workspaceId = req.workspaceId!;

  const session = await getImportSession(workspaceId, sessionId);
  if (!session) {
    return res.status(404).json({ error: "Import session not found or expired" });
  }

  return res.json({
    sessionId,
    status: session.status,
    fileName: session.fileName,
    headers: session.headers,
    stagedRows: session.stagedRows,
  });
}

/**
 * PATCH /import/:sessionId/rows/:rowId
 * Edits a single staged row before commit. Nothing here touches Postgres.
 */
export async function updateStagedRow(req: Request, res: Response) {
  const sessionId = asString(req.params.sessionId);
  const rowId = asString(req.params.rowId);
  const workspaceId = req.workspaceId!;

  const parsed = updateStagedRowSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const session = await getImportSession(workspaceId, sessionId);
  if (!session || session.status !== "reviewing") {
    return res.status(404).json({ error: "Import session not found or not ready for review" });
  }

  const rowIndex = session.stagedRows.findIndex((r) => r.id === rowId);
  if (rowIndex === -1) {
    return res.status(404).json({ error: "Row not found in this import session" });
  }

  if (parsed.data.categoryId) {
    const categoryCheck = await pool.query(
      "SELECT id FROM categories WHERE id = $1 AND workspace_id = $2",
      [parsed.data.categoryId, workspaceId]
    );
    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({ error: "Category not found in this workspace" });
    }
  }

  session.stagedRows[rowIndex] = { ...session.stagedRows[rowIndex], ...parsed.data };
  await saveImportSession(workspaceId, sessionId, session);

  return res.json({ row: session.stagedRows[rowIndex] });
}

/**
 * POST /import/:sessionId/commit
 * Writes every non-excluded staged row into transactions as one all-or-
 * nothing DB transaction, then deletes the Redis session. This is the
 * only point in the whole import flow that touches Postgres.
 */
export async function commitImport(req: Request, res: Response) {
  const sessionId = asString(req.params.sessionId);
  const workspaceId = req.workspaceId!;

  const session = await getImportSession(workspaceId, sessionId);
  if (!session || session.status !== "reviewing") {
    return res.status(404).json({ error: "Import session not found or not ready to commit" });
  }

  const rowsToCommit = session.stagedRows.filter((r) => !r.excluded);
  if (rowsToCommit.length === 0) {
    return res.status(400).json({ error: "No rows selected to import" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const row of rowsToCommit) {
      await client.query(
        `INSERT INTO transactions
           (workspace_id, category_id, merchant, amount, currency, amount_base,
            fx_rate_used, type, description, transaction_date, source)
         VALUES ($1, $2, $3, $4, 'INR', $4, NULL, $5, $6, $7, 'csv_import')`,
        [workspaceId, row.categoryId, row.description, row.amount, row.type, row.description, row.date]
      );
    }

    await client.query("COMMIT");
    await deleteImportSession(workspaceId, sessionId);

    return res.json({ message: "Import committed", importedCount: rowsToCommit.length });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Commit import error:", err);
    return res.status(500).json({ error: "Something went wrong committing the import" });
  } finally {
    client.release();
  }
}

/**
 * DELETE /import/:sessionId
 * Discards an in-progress import — no transactions are ever created.
 */
export async function discardImport(req: Request, res: Response) {
  const sessionId = asString(req.params.sessionId);
  const workspaceId = req.workspaceId!;

  const session = await getImportSession(workspaceId, sessionId);
  if (!session) {
    return res.status(404).json({ error: "Import session not found or already expired" });
  }

  await deleteImportSession(workspaceId, sessionId);
  return res.json({ message: "Import discarded" });
}