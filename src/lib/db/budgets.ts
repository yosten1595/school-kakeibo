import type { RowDataPacket } from "mysql2";
import { pool } from "./pool";
import type { Budget, BudgetInput } from "@/lib/types";

interface BudgetRow extends RowDataPacket {
  categoryId: number | null;
  categoryName: string | null;
  amount: number;
}

/** 指定した月（"YYYY-MM"）の予算。全体の予算（categoryId が null）が先頭、続いてカテゴリの登録順 */
export async function listBudgets(month: string): Promise<Budget[]> {
  const [rows] = await pool.query<BudgetRow[]>(
    `SELECT b.category_id AS categoryId, c.name AS categoryName, b.amount
     FROM budgets b
     LEFT JOIN categories c ON c.id = b.category_id
     WHERE b.month = ?
     ORDER BY b.category_key`,
    [`${month}-01`],
  );
  return rows.map((r) => ({
    categoryId: r.categoryId === null ? null : Number(r.categoryId),
    categoryName: r.categoryName,
    amount: r.amount,
  }));
}

/**
 * 指定した月の予算をまとめて保存する。amount が null のものは削除する。
 * 途中で失敗したときに一部だけ保存されないよう、1 つのトランザクションで行う。
 */
export async function saveBudgets(month: string, inputs: BudgetInput[]): Promise<void> {
  const monthDate = `${month}-01`;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const input of inputs) {
      if (input.amount === null) {
        // category_key は category_id の NULL を 0 に置き換えた列（全体の予算は 0）
        await conn.execute("DELETE FROM budgets WHERE month = ? AND category_key = ?", [
          monthDate,
          input.categoryId ?? 0,
        ]);
      } else {
        await conn.execute(
          `INSERT INTO budgets (month, category_id, amount) VALUES (?, ?, ?) AS new
           ON DUPLICATE KEY UPDATE amount = new.amount`,
          [monthDate, input.categoryId, input.amount],
        );
      }
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
