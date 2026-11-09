"use server";

import { revalidatePath } from "next/cache";
import { MAX_BUDGET, budgetFieldName, parseBudgetAmount, sumBudgets } from "@/lib/budget";
import { saveBudgets } from "@/lib/db/budgets";
import { listCategories } from "@/lib/db/categories";
import { isMonth } from "@/lib/month";
import type { BudgetFormState, BudgetInput } from "@/lib/types";

/**
 * 指定した月の予算（支出カテゴリごと）をまとめて保存する。
 * 月全体の予算は入力を受け取らず、カテゴリ別の予算の合計にする（すべて予算なしなら、全体も予算なし）。
 * 対象のカテゴリは DB から読むので、収入カテゴリや存在しないカテゴリの値は送られても無視される。
 */
export async function saveBudgetsAction(month: string, formData: FormData): Promise<BudgetFormState> {
  if (!isMonth(month)) return { errors: { form: "月の指定が正しくありません" } };

  const expenseCategories = (await listCategories()).filter((c) => c.type === "expense");
  const errors: Record<string, string> = {};
  const inputs: BudgetInput[] = [];
  for (const { id: categoryId } of expenseCategories) {
    const name = budgetFieldName(categoryId);
    const result = parseBudgetAmount(String(formData.get(name) ?? ""));
    if (result.ok) inputs.push({ categoryId, amount: result.amount });
    else errors[name] = result.error;
  }
  if (Object.keys(errors).length > 0) return { errors };

  const total = sumBudgets(inputs.map((i) => i.amount));
  if (total !== null && total > MAX_BUDGET) {
    return {
      errors: { [budgetFieldName(null)]: `合計が ${MAX_BUDGET.toLocaleString("ja-JP")} 円以下になるようにしてください` },
    };
  }
  inputs.unshift({ categoryId: null, amount: total });

  try {
    await saveBudgets(month, inputs);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "ER_NO_REFERENCED_ROW_2") {
      return { errors: { form: "削除されたカテゴリがあります。画面を再読み込みしてください" } };
    }
    console.error(e);
    return { errors: { form: "保存に失敗しました。もう一度お試しください" } };
  }
  revalidatePath("/budgets");
  revalidatePath("/");
  return { saved: true };
}
