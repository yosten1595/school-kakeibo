// 予算の使用状況の判定と、予算フォームの入力の検証。

export const MAX_BUDGET = 99_999_999;

/** ok: 80% 未満 / warning: 80% 以上 100% 以下（注意）/ over: 100% 超（警告） */
export type BudgetStatus = "ok" | "warning" | "over";

export function budgetStatus(used: number, budget: number): BudgetStatus {
  if (used > budget) return "over";
  // 小数の誤差を避けるため、used / budget >= 0.8 を整数どうしの比較にしている
  if (used * 10 >= budget * 8) return "warning";
  return "ok";
}

/** 使用率の表示。境目で状態とずれないよう切り捨て、超過なのに 100% と出るときは「100%超」にする */
export function formatUsage(used: number, budget: number): string {
  const percent = Math.floor((used / budget) * 100);
  return used > budget && percent <= 100 ? "100%超" : `${percent}%`;
}

/** フォームの入力欄の name。全体の予算は "total"、カテゴリ別は "category-<id>" */
export function budgetFieldName(categoryId: number | null): string {
  return categoryId === null ? "total" : `category-${categoryId}`;
}

export type BudgetAmountResult = { ok: true; amount: number | null } | { ok: false; error: string };

/** 予算額の入力を検証する。空欄は「予算なし」（null）。全角数字・カンマ・円記号は受け付ける */
export function parseBudgetAmount(raw: string): BudgetAmountResult {
  const value = raw.normalize("NFKC").replace(/[\s,¥円]/g, "");
  if (value === "") return { ok: true, amount: null };
  if (!/^\d+$/.test(value)) return { ok: false, error: "金額は数字で入力してください" };
  const amount = Number(value);
  if (amount < 1) {
    return { ok: false, error: "1 円以上で入力してください（予算をなくすときは空欄にします）" };
  }
  if (amount > MAX_BUDGET) {
    return { ok: false, error: `${MAX_BUDGET.toLocaleString("ja-JP")} 円以下で入力してください` };
  }
  return { ok: true, amount };
}
