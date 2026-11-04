"use client";

import { useState } from "react";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/categories/actions";
import { CategoryForm } from "@/components/CategoryForm";
import { Modal } from "@/components/Modal";
import type { CategoryWithUsage, TransactionType } from "@/lib/types";

type Dialog = { mode: "create" } | { mode: "edit"; category: CategoryWithUsage } | null;

const SECTIONS: { type: TransactionType; title: string }[] = [
  { type: "expense", title: "支出のカテゴリ" },
  { type: "income", title: "収入のカテゴリ" },
];

function usageText(c: CategoryWithUsage): string {
  const parts: string[] = [];
  if (c.transactionCount > 0) parts.push(`収支 ${c.transactionCount} 件`);
  if (c.budgetCount > 0) parts.push(`予算 ${c.budgetCount} 件`);
  return parts.length > 0 ? `使用中（${parts.join("・")}）` : "未使用";
}

export function CategoriesView({ categories }: { categories: CategoryWithUsage[] }) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleDelete(c: CategoryWithUsage) {
    if (!window.confirm(`カテゴリ「${c.name}」を削除します。よろしいですか？`)) return;
    const result = await deleteCategoryAction(c.id);
    setMessage(result.error ?? null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">カテゴリ</h1>
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setDialog({ mode: "create" });
          }}
          className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          ＋ 追加
        </button>
      </div>

      {message && (
        <p
          role="alert"
          data-testid="category-message"
          className="rounded-md bg-red-50 p-3 text-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {message}
        </p>
      )}

      {SECTIONS.map(({ type, title }) => {
        const items = categories.filter((c) => c.type === type);
        return (
          <section key={type}>
            <h2 className="mb-2 font-semibold">{title}</h2>
            {items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                カテゴリがありません
              </p>
            ) : (
              <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {items.map((c) => {
                  const inUse = c.transactionCount + c.budgetCount > 0;
                  return (
                    <li key={c.id} className="flex items-center gap-3 p-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{c.name}</div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">{usageText(c)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMessage(null);
                          setDialog({ mode: "edit", category: c });
                        }}
                        className="rounded px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        disabled={inUse}
                        title={inUse ? "使用中のカテゴリは削除できません" : undefined}
                        onClick={() => handleDelete(c)}
                        className="rounded px-2 py-1 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-red-400 dark:hover:bg-red-950"
                      >
                        削除
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      {dialog?.mode === "create" && (
        <Modal title="カテゴリの追加" onClose={() => setDialog(null)}>
          <CategoryForm
            action={createCategoryAction}
            mode="create"
            initialName=""
            initialType="expense"
            submitLabel="追加する"
            onSaved={() => setDialog(null)}
            onCancel={() => setDialog(null)}
          />
        </Modal>
      )}

      {dialog?.mode === "edit" && (
        <Modal title="カテゴリの編集" onClose={() => setDialog(null)}>
          <CategoryForm
            key={dialog.category.id}
            action={updateCategoryAction.bind(null, dialog.category.id)}
            mode="edit"
            initialName={dialog.category.name}
            initialType={dialog.category.type}
            submitLabel="更新する"
            onSaved={() => setDialog(null)}
            onCancel={() => setDialog(null)}
          />
        </Modal>
      )}
    </div>
  );
}
