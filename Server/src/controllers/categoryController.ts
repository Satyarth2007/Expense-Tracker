import { Request, Response } from "express";
import { pool } from "../config/db.js";
import { createCategorySchema, updateCategorySchema } from "../validators/categoryValidators.js";

/**
 * GET /categories
 * Lists all categories in the caller's workspace.
 */
export async function listCategories(req: Request, res: Response) {
  const workspaceId = req.workspaceId!;

  try {
    const result = await pool.query(
      `SELECT id, parent_id, name, type, color, icon, is_tax_deductible, created_at, updated_at
       FROM categories
       WHERE workspace_id = $1
       ORDER BY name ASC`,
      [workspaceId]
    );
    return res.json({ categories: result.rows });
  } catch (err) {
    console.error("List categories error:", err);
    return res.status(500).json({ error: "Something went wrong fetching categories" });
  }
}

/**
 * POST /categories
 * Creates a category scoped to the caller's workspace.
 */
export async function createCategory(req: Request, res: Response) {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const workspaceId = req.workspaceId!;
  const { name, type, parentId, color, icon, isTaxDeductible } = parsed.data;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // If a parent is given, confirm it exists and belongs to this workspace
    if (parentId) {
      const parentCheck = await client.query(
        "SELECT id FROM categories WHERE id = $1 AND workspace_id = $2",
        [parentId, workspaceId]
      );
      if (parentCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Parent category not found in this workspace" });
      }
    }

    const result = await client.query(
      `INSERT INTO categories (workspace_id, parent_id, name, type, color, icon, is_tax_deductible)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, parent_id, name, type, color, icon, is_tax_deductible, created_at, updated_at`,
      [workspaceId, parentId ?? null, name, type, color ?? null, icon ?? null, isTaxDeductible]
    );

    await client.query("COMMIT");
    return res.status(201).json({ category: result.rows[0] });
  } catch (err: any) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      // idx_categories_unique_name_per_parent violation
      return res.status(409).json({ error: "A category with this name already exists at this level" });
    }
    console.error("Create category error:", err);
    return res.status(500).json({ error: "Something went wrong creating the category" });
  } finally {
    client.release();
  }
}

/**
 * PATCH /categories/:id
 * Updates a category. Only fields present in the body are changed.
 */
export async function updateCategory(req: Request, res: Response) {
  const { id } = req.params;
  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const workspaceId = req.workspaceId!;
  const fields = parsed.data;

  // Build the SET clause dynamically from whichever fields were provided
  const columnMap: Record<string, string> = {
    name: "name",
    type: "type",
    parentId: "parent_id",
    color: "color",
    icon: "icon",
    isTaxDeductible: "is_tax_deductible",
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

    if (fields.parentId) {
      if (fields.parentId === id) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "A category cannot be its own parent" });
      }
      const parentCheck = await client.query(
        "SELECT id FROM categories WHERE id = $1 AND workspace_id = $2",
        [fields.parentId, workspaceId]
      );
      if (parentCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Parent category not found in this workspace" });
      }
    }

    const result = await client.query(
      `UPDATE categories
       SET ${setClauses.join(", ")}
       WHERE id = $${paramIndex} AND workspace_id = $${paramIndex + 1}
       RETURNING id, parent_id, name, type, color, icon, is_tax_deductible, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Category not found" });
    }

    await client.query("COMMIT");
    return res.json({ category: result.rows[0] });
  } catch (err: any) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      return res.status(409).json({ error: "A category with this name already exists at this level" });
    }
    console.error("Update category error:", err);
    return res.status(500).json({ error: "Something went wrong updating the category" });
  } finally {
    client.release();
  }
}

/**
 * DELETE /categories/:id
 * Deletes a category scoped to the caller's workspace.
 * Child categories are detached (parent_id -> NULL) per schema's ON DELETE SET NULL.
 */
export async function deleteCategory(req: Request, res: Response) {
  const { id } = req.params;
  const workspaceId = req.workspaceId!;

  try {
    const result = await pool.query(
      "DELETE FROM categories WHERE id = $1 AND workspace_id = $2 RETURNING id",
      [id, workspaceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (err: any) {
    if (err.code === "23503") {
      // FK violation — category is referenced elsewhere (e.g. transactions)
      return res.status(409).json({ error: "This category is in use and cannot be deleted" });
    }
    console.error("Delete category error:", err);
    return res.status(500).json({ error: "Something went wrong deleting the category" });
  }
}