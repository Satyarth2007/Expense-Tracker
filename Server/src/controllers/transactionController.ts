import { Request, Response } from "express";
import { pool } from "../config/db.js";
import {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
} from "../validators/transactionValidators.js";

/**
 * GET /transactions
 * Lists non-deleted transactions in the caller's workspace, newest first.
 * Supports optional filters: categoryId, type, search (merchant/description), from/to date range, pagination.
 */
export async function listTransactions(req: Request, res: Response) {
  const parsed = listTransactionsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const workspaceId = req.workspaceId!;
  const { categoryId, type, search, from, to, limit, offset } = parsed.data;

  const conditions: string[] = ["workspace_id = $1", "deleted_at IS NULL"];
  const values: any[] = [workspaceId];
  let paramIndex = 2;

  if (categoryId) {
    conditions.push(`category_id = $${paramIndex}`);
    values.push(categoryId);
    paramIndex++;
  }
  if (type) {
    conditions.push(`type = $${paramIndex}`);
    values.push(type);
    paramIndex++;
  }
  if (search) {
    conditions.push(`(merchant ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
    values.push(`%${search}%`);
    paramIndex++;
  }
  if (from) {
    conditions.push(`transaction_date >= $${paramIndex}`);
    values.push(from);
    paramIndex++;
  }
  if (to) {
    conditions.push(`transaction_date <= $${paramIndex}`);
    values.push(to);
    paramIndex++;
  }

  values.push(limit, offset);

  try {
    const result = await pool.query(
      `SELECT id, category_id, merchant, amount, currency, type, description,
              transaction_date, source, created_at, updated_at
       FROM transactions
       WHERE ${conditions.join(" AND ")}
       ORDER BY transaction_date DESC, created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    );
    return res.json({ transactions: result.rows });
  } catch (err) {
    console.error("List transactions error:", err);
    return res.status(500).json({ error: "Something went wrong fetching transactions" });
  }
}

/**
 * POST /transactions
 * Creates a manually-entered transaction. Currency is fixed to INR for now
 * (no FX conversion yet) — amount_base mirrors amount, fx_rate_used stays null.
 */
export async function createTransaction(req: Request, res: Response) {
  const parsed = createTransactionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const workspaceId = req.workspaceId!;
  const { categoryId, merchant, amount, type, description, transactionDate } = parsed.data;

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

    const result = await client.query(
      `INSERT INTO transactions
         (workspace_id, category_id, merchant, amount, currency, amount_base, fx_rate_used,
          type, description, transaction_date, source)
       VALUES ($1, $2, $3, $4, 'INR', $4, NULL, $5, $6, $7, 'manual')
       RETURNING id, category_id, merchant, amount, currency, type, description,
                 transaction_date, source, created_at, updated_at`,
      [workspaceId, categoryId ?? null, merchant ?? null, amount, type, description ?? null, transactionDate]
    );

    await client.query("COMMIT");
    return res.status(201).json({ transaction: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create transaction error:", err);
    return res.status(500).json({ error: "Something went wrong creating the transaction" });
  } finally {
    client.release();
  }
}

/**
 * PATCH /transactions/:id
 * Updates a transaction. Only fields present in the body are changed.
 */
export async function updateTransaction(req: Request, res: Response) {
  const { id } = req.params;
  const parsed = updateTransactionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const workspaceId = req.workspaceId!;
  const fields = parsed.data;

  const columnMap: Record<string, string> = {
    categoryId: "category_id",
    merchant: "merchant",
    amount: "amount",
    type: "type",
    description: "description",
    transactionDate: "transaction_date",
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

  // Keep amount_base in sync with amount, since there's no FX conversion yet
  if ("amount" in fields) {
    setClauses.push(`amount_base = $${paramIndex}`);
    values.push(fields.amount);
    paramIndex++;
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
      `UPDATE transactions
       SET ${setClauses.join(", ")}
       WHERE id = $${paramIndex} AND workspace_id = $${paramIndex + 1} AND deleted_at IS NULL
       RETURNING id, category_id, merchant, amount, currency, type, description,
                 transaction_date, source, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Transaction not found" });
    }

    await client.query("COMMIT");
    return res.json({ transaction: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Update transaction error:", err);
    return res.status(500).json({ error: "Something went wrong updating the transaction" });
  } finally {
    client.release();
  }
}

/**
 * DELETE /transactions/:id
 * Soft-deletes a transaction by setting deleted_at, scoped to the caller's workspace.
 */
export async function deleteTransaction(req: Request, res: Response) {
  const { id } = req.params;
  const workspaceId = req.workspaceId!;

  try {
    const result = await pool.query(
      `UPDATE transactions
       SET deleted_at = now()
       WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, workspaceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    return res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (err) {
    console.error("Delete transaction error:", err);
    return res.status(500).json({ error: "Something went wrong deleting the transaction" });
  }
}