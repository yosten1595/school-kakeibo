"use server";

import { revalidatePath } from "next/cache";
import { createCategory, deleteCategory, updateCategoryName } from "@/lib/db/categories";
import { parseCategoryForm } from "@/lib/category-form";
import type { CategoryFormState } from "@/lib/types";

function dbErrorToState(e: unknown): CategoryFormState {
  const code = (e as { code?: string }).code;
  if (code === "ER_DUP_ENTRY") {
    return { errors: { name: "同じ名前のカテゴリが既にあります" } };
  }
  console.error(e);
  return { errors: { form: "保存に失敗しました。もう一度お試しください" } };
}

export async function createCategoryAction(formData: FormData): Promise<CategoryFormState> {
  const parsed = parseCategoryForm(formData, true);
  if (!parsed.ok) return parsed.state;
  try {
    await createCategory(parsed.name, parsed.type);
  } catch (e) {
    return dbErrorToState(e);
  }
  revalidatePath("/categories");
  return { saved: true };
}

export async function updateCategoryAction(
  id: number,
  formData: FormData,
): Promise<CategoryFormState> {
  const parsed = parseCategoryForm(formData, false);
  if (!parsed.ok) return parsed.state;
  try {
    const updated = await updateCategoryName(id, parsed.name);
    if (!updated) return { errors: { form: "このカテゴリは既に削除されています" } };
  } catch (e) {
    return dbErrorToState(e);
  }
  revalidatePath("/categories");
  return { saved: true };
}

export async function deleteCategoryAction(id: number): Promise<{ error?: string }> {
  if (!Number.isInteger(id) || id < 1) return {};
  try {
    await deleteCategory(id);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "ER_ROW_IS_REFERENCED_2") {
      return { error: "このカテゴリは収支または予算で使われているため、削除できません" };
    }
    console.error(e);
    return { error: "削除に失敗しました。もう一度お試しください" };
  }
  revalidatePath("/categories");
  return {};
}
