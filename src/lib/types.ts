export type TransactionType = "income" | "expense";

export interface Category {
  id: number;
  name: string;
  type: TransactionType;
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
