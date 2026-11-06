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

/** 1か月の、あるカテゴリの支出合計 */
export interface CategoryExpense {
  categoryId: number;
  categoryName: string;
  total: number;
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
