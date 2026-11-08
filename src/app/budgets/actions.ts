"use server";

import { revalidatePath } from "next/cache";
import { budgetFieldName, parseBudgetAmount } from "@/lib/budget";
import { saveBudgets } from "@/lib/db/budgets";
import { listCategories } from "@/lib/db/categories";
import { isMonth } from "@/lib/month";
import type { BudgetFormState, BudgetInput } from "@/lib/types";

/**
 * 指定した月の予算（全体と、支出カテゴリごと）をまとめて保存する。
 * 対象のカテゴリは DB から読むので、収入カテゴリや存在しないカテゴリの値は送られても無視される。
 */
export async function saveBudgetsAction(month: string, formData: FormData): Promise<BudgetFormState> {
  if (!isMonth(month)) return { errors: { form: "月の指定が正しくありません" } };

  const expenseCategories = (await listCategories()).filter((c) => c.type === "expense");
  const targets = [null, ...expenseCategories.map((c) => c.id)];
  const errors: Record<string, string> = {};
  const inputs: BudgetInput[] = [];
  for (const categoryId of targets) {
    const name = budgetFieldName(categoryId);
    const result = parseBudgetAmount(String(formData.get(name) ?? ""));
    if (result.ok) inputs.push({ categoryId, amount: result.amount });
    else errors[name] = result.error;
  }
  if (Object.keys(errors).length > 0) return { errors };

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
