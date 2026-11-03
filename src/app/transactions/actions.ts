"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/lib/db/transactions";
import { parseTransactionForm } from "@/lib/transaction-form";
import type { TransactionFormState, TransactionInput } from "@/lib/types";

// 種別とカテゴリの不一致などで DB が外部キー制約エラーを返したとき
function dbErrorToState(e: unknown, state: TransactionFormState): TransactionFormState {
  const code = (e as { code?: string }).code;
  if (code === "ER_NO_REFERENCED_ROW_2") {
    return {
      ...state,
      errors: { categoryId: "選んだ種別に合わないカテゴリです。選び直してください" },
    };
  }
  console.error(e);
  return { ...state, errors: { form: "保存に失敗しました。もう一度お試しください" } };
}

function stateOf(formData: FormData): TransactionFormState {
  const str = (n: string) => String(formData.get(n) ?? "");
  return {
    values: {
      date: str("date"),
      type: str("type"),
      amount: str("amount"),
      categoryId: str("categoryId"),
      memo: str("memo"),
    },
  };
}

function afterSave(input: TransactionInput): never {
  revalidatePath("/transactions");
  redirect(`/transactions?month=${input.date.slice(0, 7)}`);
}

export async function createTransactionAction(
  _prev: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const parsed = parseTransactionForm(formData);
  if (!parsed.ok) return parsed.state;
  try {
    await createTransaction(parsed.input);
  } catch (e) {
    return dbErrorToState(e, stateOf(formData));
  }
  return afterSave(parsed.input);
}

export async function updateTransactionAction(
  id: number,
  _prev: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const parsed = parseTransactionForm(formData);
  if (!parsed.ok) return parsed.state;
  try {
    const updated = await updateTransaction(id, parsed.input);
    if (!updated) {
      return { ...stateOf(formData), errors: { form: "この収支は既に削除されています" } };
    }
  } catch (e) {
    return dbErrorToState(e, stateOf(formData));
  }
  return afterSave(parsed.input);
}

export async function deleteTransactionAction(id: number): Promise<void> {
  if (!Number.isInteger(id) || id < 1) return;
  await deleteTransaction(id);
  revalidatePath("/transactions");
}
