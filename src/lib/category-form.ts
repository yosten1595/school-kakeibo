import type { CategoryFormState, TransactionType } from "@/lib/types";

export const MAX_NAME_LENGTH = 50;

export type CategoryParseResult =
  | { ok: true; name: string; type: TransactionType }
  | { ok: false; state: CategoryFormState };

/** カテゴリのフォーム入力を検証する（サーバー側）。エラーは日本語で返す。 */
export function parseCategoryForm(formData: FormData, requireType: boolean): CategoryParseResult {
  // trim() は全角スペースも取り除く（全角スペースだけの名前も空として扱える）
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const errors: NonNullable<CategoryFormState["errors"]> = {};

  if (name === "") errors.name = "カテゴリ名を入力してください";
  else if (name.length > MAX_NAME_LENGTH) {
    errors.name = `カテゴリ名は ${MAX_NAME_LENGTH} 文字以内で入力してください`;
  }
  if (requireType && type !== "income" && type !== "expense") {
    errors.type = "収入か支出を選んでください";
  }

  if (Object.keys(errors).length > 0) return { ok: false, state: { errors } };
  return { ok: true, name, type: type as TransactionType };
}
