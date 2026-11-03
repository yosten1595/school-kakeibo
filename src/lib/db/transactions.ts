import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "./pool";
import { monthRange } from "@/lib/month";
import type { Transaction, TransactionInput } from "@/lib/types";

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

export async function getTransaction(id: number): Promise<Transaction | null> {
  const [rows] = await pool.query<TransactionRow[]>(`${SELECT_SQL} WHERE t.id = ?`, [id]);
  return rows[0] ? toTransaction(rows[0]) : null;
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
