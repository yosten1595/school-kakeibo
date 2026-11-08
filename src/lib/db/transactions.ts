import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "./pool";
import { monthRange, yearRange } from "@/lib/month";
import { NO_FILTER } from "@/lib/transaction-filter";
import { addDays, recentWeekStarts } from "@/lib/week";
import type {
  CategoryExpense,
  CategoryYearlyExpense,
  MonthlySummary,
  MonthlyTotal,
  Transaction,
  TransactionFilter,
  TransactionInput,
  CategoryWeekly,
  WeeklyBreakdown,
  WeeklyTotal,
  YearlyOverview,
} from "@/lib/types";

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

/** LIKE の特殊文字（\ % _）を、ただの文字として検索できるようにエスケープする */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

/** 指定した月（"YYYY-MM"）の収支を、新しい順に返す。filter で絞り込める */
export async function listTransactionsByMonth(
  month: string,
  filter: TransactionFilter = NO_FILTER,
): Promise<Transaction[]> {
  const { start, end } = monthRange(month);
  // 条件は固定の SQL 断片だけを組み合わせ、値はすべてプレースホルダで渡す
  const conditions = ["t.date >= ?", "t.date < ?"];
  const params: (string | number)[] = [start, end];
  if (filter.keyword) {
    conditions.push("t.memo LIKE ?");
    params.push(`%${escapeLike(filter.keyword)}%`);
  }
  if (filter.type) {
    conditions.push("t.type = ?");
    params.push(filter.type);
  }
  if (filter.categoryId !== null) {
    conditions.push("t.category_id = ?");
    params.push(filter.categoryId);
  }
  const [rows] = await pool.query<TransactionRow[]>(
    `${SELECT_SQL} WHERE ${conditions.join(" AND ")} ORDER BY t.date DESC, t.id DESC`,
    params,
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

interface MonthlyTotalRow extends RowDataPacket {
  month: number;
  type: "income" | "expense";
  total: string; // SUM は文字列で返る
}

interface CategoryMonthRow extends RowDataPacket {
  categoryId: number;
  categoryName: string;
  month: number;
  total: string; // SUM は文字列で返る
}

interface WeeklyCategoryRow extends RowDataPacket {
  weekStart: string;
  categoryId: number;
  categoryName: string;
  type: "income" | "expense";
  total: string; // SUM は文字列で返る
}

/**
 * today を含む週までの直近 count 週（月曜始まり）の、週ごとの収支と、収入・支出のカテゴリ別の内訳。
 * 記録のない週は 0。
 */
export async function getWeeklyBreakdown(today: string, count: number): Promise<WeeklyBreakdown> {
  const starts = recentWeekStarts(today, count);
  const [rows] = await pool.query<WeeklyCategoryRow[]>(
    // WEEKDAY は月曜=0。日付から曜日の分を引くと、その週の月曜日になる（年や月をまたぐ週も 1 週として集計できる）
    `SELECT DATE_FORMAT(DATE_SUB(t.date, INTERVAL WEEKDAY(t.date) DAY), '%Y-%m-%d') AS weekStart,
            c.id AS categoryId, c.name AS categoryName, t.type, SUM(t.amount) AS total
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.date >= ? AND t.date < ?
     GROUP BY weekStart, c.id, c.name, t.type`,
    [starts[0], addDays(starts[starts.length - 1], 7)],
  );

  const index = new Map(starts.map((s, i) => [s, i]));
  const byType = { income: new Map<number, CategoryWeekly>(), expense: new Map<number, CategoryWeekly>() };
  for (const r of rows) {
    const i = index.get(r.weekStart);
    if (i === undefined) continue;
    const categories = byType[r.type];
    const category = categories.get(r.categoryId) ?? {
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      weeks: Array<number>(starts.length).fill(0),
      total: 0,
    };
    category.weeks[i] += Number(r.total);
    category.total += Number(r.total);
    categories.set(r.categoryId, category);
  }

  const sorted = (m: Map<number, CategoryWeekly>) => [...m.values()].sort((a, b) => b.total - a.total);
  const income = sorted(byType.income);
  const expense = sorted(byType.expense);
  const sumAt = (list: CategoryWeekly[], i: number) => list.reduce((sum, c) => sum + c.weeks[i], 0);
  const weeks: WeeklyTotal[] = starts.map((weekStart, i) => {
    const weekIncome = sumAt(income, i);
    const weekExpense = sumAt(expense, i);
    return { weekStart, income: weekIncome, expense: weekExpense, balance: weekIncome - weekExpense };
  });
  return { weeks, income, expense };
}

interface CategoryMonthlyRow extends RowDataPacket {
  month: number;
  total: string; // SUM は文字列で返る
}

/** 指定した年（"YYYY"）の、あるカテゴリの 1〜12 月の金額（長さ 12。記録のない月は 0） */
export async function getCategoryMonthly(year: string, categoryId: number): Promise<number[]> {
  const { start, end } = yearRange(year);
  const [rows] = await pool.query<CategoryMonthlyRow[]>(
    `SELECT MONTH(date) AS month, SUM(amount) AS total
     FROM transactions
     WHERE category_id = ? AND date >= ? AND date < ?
     GROUP BY MONTH(date)`,
    [categoryId, start, end],
  );
  const amounts = Array<number>(12).fill(0);
  for (const r of rows) amounts[r.month - 1] = Number(r.total);
  return amounts;
}

/** 指定した年（"YYYY"）の月別の収支と、カテゴリ別・月別の支出 */
export async function getYearlyOverview(year: string): Promise<YearlyOverview> {
  const { start, end } = yearRange(year);
  const [[totalRows], [categoryRows]] = await Promise.all([
    pool.query<MonthlyTotalRow[]>(
      `SELECT MONTH(date) AS month, type, SUM(amount) AS total
       FROM transactions
       WHERE date >= ? AND date < ?
       GROUP BY MONTH(date), type`,
      [start, end],
    ),
    pool.query<CategoryMonthRow[]>(
      `SELECT c.id AS categoryId, c.name AS categoryName, MONTH(t.date) AS month, SUM(t.amount) AS total
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.type = 'expense' AND t.date >= ? AND t.date < ?
       GROUP BY c.id, c.name, MONTH(t.date)`,
      [start, end],
    ),
  ]);

  const months: MonthlyTotal[] = Array.from({ length: 12 }, (_, i) => {
    const total = (type: "income" | "expense") =>
      Number(totalRows.find((r) => r.month === i + 1 && r.type === type)?.total ?? 0);
    const income = total("income");
    const expense = total("expense");
    return { month: i + 1, income, expense, balance: income - expense };
  });

  const categories = new Map<number, CategoryYearlyExpense>();
  for (const r of categoryRows) {
    const category = categories.get(r.categoryId) ?? {
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      months: Array<number>(12).fill(0),
      total: 0,
    };
    category.months[r.month - 1] = Number(r.total);
    category.total += Number(r.total);
    categories.set(r.categoryId, category);
  }

  return { months, categories: [...categories.values()].sort((a, b) => b.total - a.total) };
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
