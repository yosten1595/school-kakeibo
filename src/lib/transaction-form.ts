import type { TransactionFormState, TransactionInput } from "@/lib/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_AMOUNT = 99_999_999;

function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export type ParseResult =
  | { ok: true; input: TransactionInput }
  | { ok: false; state: TransactionFormState };

/** フォームの入力を検証する（サーバー側）。エラーは日本語で返す。 */
export function parseTransactionForm(formData: FormData): ParseResult {
  const str = (name: string) => String(formData.get(name) ?? "").trim();
  const values = {
    date: str("date"),
    type: str("type"),
    amount: str("amount"),
    categoryId: str("categoryId"),
    memo: str("memo"),
  };
  const errors: NonNullable<TransactionFormState["errors"]> = {};

  if (!values.date) errors.date = "日付を入力してください";
  else if (!isValidDate(values.date)) errors.date = "日付の形式が正しくありません";

  if (values.type !== "income" && values.type !== "expense") {
    errors.type = "収入か支出を選んでください";
  }

  const amount = Number(values.amount);
  if (!values.amount) errors.amount = "金額を入力してください";
  else if (!/^\d+$/.test(values.amount)) errors.amount = "金額は半角の整数で入力してください";
  else if (amount < 1) errors.amount = "金額は 1 円以上で入力してください";
  else if (amount > MAX_AMOUNT) errors.amount = "金額が大きすぎます（9,999万円まで）";

  const categoryId = Number(values.categoryId);
  if (!values.categoryId || !Number.isInteger(categoryId) || categoryId < 1) {
    errors.categoryId = "カテゴリを選んでください";
  }

  if (values.memo.length > 255) errors.memo = "メモは 255 文字以内で入力してください";

  if (Object.keys(errors).length > 0) return { ok: false, state: { errors, values } };

  return {
    ok: true,
    input: {
      date: values.date,
      type: values.type as "income" | "expense",
      amount,
      categoryId,
      memo: values.memo === "" ? null : values.memo,
    },
  };
}
