import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "./pool";
import { monthRange } from "@/lib/month";
import type { CategoryExpense, MonthlySummary, Transaction, TransactionInput } from "@/lib/types";

interface TransactionRow extends RowDataPacket {
  id: number;
  date: string;
  type: "income" | "expense";
  amount: number;
  categoryId: number;
  categoryName: string;
  memo: string | null;
}

const SELECT_SQL = `
  SELECT t.id, t.date, t.type, t.amount,
         t.category_id AS categoryId, c.name AS categoryName, t.memo
  FROM transactions t
  JOIN categories c ON c.id = t.category_id`;

const toTransaction = (r: TransactionRow): Transaction => ({
  id: r.id,
  date: r.date,
  type: r.type,
  amount: r.amount,
  categoryId: r.categoryId,
  categoryName: r.categoryName,
  memo: r.memo,
});

/** 指定した月（"YYYY-MM"）の収支を、新しい順に返す */
export async function listTransactionsByMonth(month: string): Promise<Transaction[]> {
  const { start, end } = monthRange(month);
  const [rows] = await pool.query<TransactionRow[]>(
    `${SELECT_SQL} WHERE t.date >= ? AND t.date < ? ORDER BY t.date DESC, t.id DESC`,
    [start, end],
  );
  return rows.map(toTransaction);
}

interface SummaryRow extends RowDataPacket {
  type: "income" | "expense";
  total: string; // SUM は文字列で返る
}

/** 指定した月（"YYYY-MM"）の収入合計・支出合計・差額 */
export async function getMonthlySummary(month: string): Promise<MonthlySummary> {
  const { start, end } = monthRange(month);
  const [rows] = await pool.query<SummaryRow[]>(
    `SELECT type, SUM(amount) AS total
     FROM transactions
     WHERE date >= ? AND date < ?
     GROUP BY type`,
    [start, end],
  );
  const total = (type: "income" | "expense") => Number(rows.find((r) => r.type === type)?.total ?? 0);
  const income = total("income");
  const expense = total("expense");
  return { income, expense, balance: income - expense };
}

interface CategoryExpenseRow extends RowDataPacket {
  categoryId: number;
  categoryName: string;
  total: string; // SUM は文字列で返る
}

/** 指定した月（"YYYY-MM"）の支出をカテゴリ別に集計し、全支出カテゴリを登録順で返す（支出なしは 0） */
export async function getExpenseByCategory(month: string): Promise<CategoryExpense[]> {
  const { start, end } = monthRange(month);
  const [rows] = await pool.query<CategoryExpenseRow[]>(
    `SELECT c.id AS categoryId, c.name AS categoryName, COALESCE(SUM(t.amount), 0) AS total
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id AND t.date >= ? AND t.date < ?
     WHERE c.type = 'expense'
     GROUP BY c.id, c.name
     ORDER BY c.id`,
    [start, end],
  );
  return rows.map((r) => ({
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    total: Number(r.total),
  }));
}

export async function createTransaction(input: TransactionInput): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    "INSERT INTO transactions (date, type, amount, category_id, memo) VALUES (?, ?, ?, ?, ?)",
    [input.date, input.type, input.amount, input.categoryId, input.memo],
  );
  return result.insertId;
}

/** 更新できたら true、対象が無ければ false */
export async function updateTransaction(id: number, input: TransactionInput): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    "UPDATE transactions SET date = ?, type = ?, amount = ?, category_id = ?, memo = ? WHERE id = ?",
    [input.date, input.type, input.amount, input.categoryId, input.memo, id],
  );
  return result.affectedRows > 0;
}

export async function deleteTransaction(id: number): Promise<void> {
  await pool.execute("DELETE FROM transactions WHERE id = ?", [id]);
}
