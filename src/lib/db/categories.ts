import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "./pool";
import type { Category, CategoryWithUsage, TransactionType } from "@/lib/types";

interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  type: TransactionType;
}

interface CategoryUsageRow extends CategoryRow {
  transactionCount: number;
  budgetCount: number;
}

export async function listCategories(): Promise<Category[]> {
  const [rows] = await pool.query<CategoryRow[]>(
    "SELECT id, name, type FROM categories ORDER BY type DESC, id",
  );
  return rows.map((r) => ({ id: r.id, name: r.name, type: r.type }));
}

/** 各カテゴリが、収支・予算で何件使われているかも一緒に返す */
export async function listCategoriesWithUsage(): Promise<CategoryWithUsage[]> {
  const [rows] = await pool.query<CategoryUsageRow[]>(
    `SELECT c.id, c.name, c.type,
            (SELECT COUNT(*) FROM transactions t WHERE t.category_id = c.id) AS transactionCount,
            (SELECT COUNT(*) FROM budgets b WHERE b.category_id = c.id) AS budgetCount
     FROM categories c
     ORDER BY c.type DESC, c.id`,
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    transactionCount: Number(r.transactionCount),
    budgetCount: Number(r.budgetCount),
  }));
}

export async function createCategory(name: string, type: TransactionType): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    "INSERT INTO categories (name, type) VALUES (?, ?)",
    [name, type],
  );
  return result.insertId;
}

/** 名前だけ変更できる（種別を変えると、既存の収支の種別と矛盾するため）。対象があれば true */
export async function updateCategoryName(id: number, name: string): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    "UPDATE categories SET name = ? WHERE id = ?",
    [name, id],
  );
  return result.affectedRows > 0;
}

/** 使用中のカテゴリは DB が外部キー制約で削除を拒否する（ER_ROW_IS_REFERENCED_2） */
export async function deleteCategory(id: number): Promise<void> {
  await pool.execute("DELETE FROM categories WHERE id = ?", [id]);
}
