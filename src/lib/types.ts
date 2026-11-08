export type TransactionType = "income" | "expense";

export interface Category {
  id: number;
  name: string;
  type: TransactionType;
}

export interface CategoryWithUsage extends Category {
  transactionCount: number; // このカテゴリを使っている収支の件数
  budgetCount: number; // 使っている予算の件数
}

export interface CategoryFormState {
  errors?: Partial<Record<"name" | "type" | "form", string>>;
  saved?: boolean;
}

export interface Transaction {
  id: number;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  amount: number;
  categoryId: number;
  categoryName: string;
  memo: string | null;
}

export interface MonthlySummary {
  income: number;
  expense: number;
  balance: number; // 収入 - 支出（赤字なら負）
}

/** 年間ページの、1か月分の収支 */
export interface MonthlyTotal extends MonthlySummary {
  month: number; // 1〜12
}

/** 1 週間分の収支。weekStart はその週の月曜日（YYYY-MM-DD） */
export interface WeeklyTotal extends MonthlySummary {
  weekStart: string;
}

/** 直近の各週の、あるカテゴリの金額 */
export interface CategoryWeekly {
  categoryId: number;
  categoryName: string;
  weeks: number[]; // WeeklyBreakdown.weeks と同じ並び（古い順）
  total: number;
}

/** 週別の収支と、カテゴリ別の内訳 */
export interface WeeklyBreakdown {
  weeks: WeeklyTotal[]; // 古い順
  income: CategoryWeekly[]; // 期間中に記録があるカテゴリのみ。合計が大きい順
  expense: CategoryWeekly[];
}

/** 1年間の、あるカテゴリの支出 */
export interface CategoryYearlyExpense {
  categoryId: number;
  categoryName: string;
  months: number[]; // 1〜12月の支出合計（長さ 12）
  total: number;
}

export interface YearlyOverview {
  months: MonthlyTotal[]; // 1〜12月（長さ 12）
  categories: CategoryYearlyExpense[]; // 支出があるカテゴリのみ。年間の支出が大きい順
}

/** 1か月の、あるカテゴリの支出合計 */
export interface CategoryExpense {
  categoryId: number;
  categoryName: string;
  total: number;
}

/** 1か月の予算。categoryId が null なら月全体の予算 */
export interface Budget {
  categoryId: number | null;
  categoryName: string | null;
  amount: number;
}

/** 予算の保存内容。amount が null なら、その予算を削除する */
export interface BudgetInput {
  categoryId: number | null;
  amount: number | null;
}

export interface BudgetFormState {
  /** キーは入力欄の name（"total" / "category-<id>"）または "form" */
  errors?: Record<string, string>;
  saved?: boolean;
}

/** 収支一覧の絞り込み条件。null・空文字は「指定なし」 */
export interface TransactionFilter {
  keyword: string; // メモに含まれる文字
  type: TransactionType | null;
  categoryId: number | null;
}

export interface TransactionInput {
  date: string;
  type: TransactionType;
  amount: number;
  categoryId: number;
  memo: string | null;
}

// フォームの状態。エラーがあれば入力値を残して画面に戻す。
export interface TransactionFormState {
  /** 保存に成功したとき、その収支の月（YYYY-MM） */
  savedMonth?: string;
  errors?: Partial<Record<"date" | "type" | "amount" | "categoryId" | "memo" | "form", string>>;
  values?: {
    date: string;
    type: string;
    amount: string;
    categoryId: string;
    memo: string;
  };
}
