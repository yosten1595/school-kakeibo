"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteButton } from "@/components/DeleteButton";
import { Modal } from "@/components/Modal";
import { TransactionForm } from "@/components/TransactionForm";
import {
  createTransactionAction,
  deleteTransactionAction,
  updateTransactionAction,
} from "@/app/transactions/actions";
import { formatMonth, formatYen, shiftMonth } from "@/lib/month";
import type { Category, Transaction } from "@/lib/types";

type Dialog = { mode: "create" } | { mode: "edit"; transaction: Transaction } | null;

export function TransactionsView({
  month,
  today,
  transactions,
  categories,
}: {
  month: string;
  today: string;
  transactions: Transaction[];
  categories: Category[];
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog>(null);

  function handleSaved(savedMonth: string) {
    setDialog(null);
    // 保存した収支が表示中の月と違う月なら、その月を表示する（同じ月なら一覧は自動で更新される）
    if (savedMonth !== month) router.push(`/transactions?month=${savedMonth}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">収支一覧</h1>
        <button
          type="button"
          onClick={() => setDialog({ mode: "create" })}
          className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          ＋ 登録
        </button>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href={`/transactions?month=${shiftMonth(month, -1)}`}
          className="rounded px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          ← 前月
        </Link>
        <h2 className="text-lg font-semibold">{formatMonth(month)}</h2>
        <Link
          href={`/transactions?month=${shiftMonth(month, 1)}`}
          className="rounded px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          翌月 →
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          この月の収支はまだありません
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {transactions.map((t) => (
            <li key={t.id} className="flex items-center gap-3 p-3">
              <div className="w-14 shrink-0 text-sm text-zinc-600 dark:text-zinc-400">
                {t.date.slice(5).replace("-", "/")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{t.categoryName}</div>
                {t.memo && (
                  <div className="truncate text-sm text-zinc-600 dark:text-zinc-400">{t.memo}</div>
                )}
              </div>
              <div
                className={`shrink-0 font-semibold tabular-nums ${
                  t.type === "income"
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-red-700 dark:text-red-400"
                }`}
              >
                {t.type === "income" ? "+" : "-"}
                {formatYen(t.amount)}
              </div>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => setDialog({ mode: "edit", transaction: t })}
                  className="rounded px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  編集
                </button>
                <DeleteButton
                  action={deleteTransactionAction.bind(null, t.id)}
                  label={`${t.date} ${t.categoryName} ${formatYen(t.amount)}`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {dialog?.mode === "create" && (
        <Modal title="収支の登録" onClose={() => setDialog(null)}>
          <TransactionForm
            action={createTransactionAction}
            categories={categories}
            initial={{ date: today, type: "expense", amount: "", categoryId: "", memo: "" }}
            submitLabel="登録する"
            onSaved={handleSaved}
            onCancel={() => setDialog(null)}
          />
        </Modal>
      )}

      {dialog?.mode === "edit" && (
        <Modal title="収支の編集" onClose={() => setDialog(null)}>
          <TransactionForm
            key={dialog.transaction.id}
            action={updateTransactionAction.bind(null, dialog.transaction.id)}
            categories={categories}
            initial={{
              date: dialog.transaction.date,
              type: dialog.transaction.type,
              amount: String(dialog.transaction.amount),
              categoryId: String(dialog.transaction.categoryId),
              memo: dialog.transaction.memo ?? "",
            }}
            submitLabel="更新する"
            onSaved={handleSaved}
            onCancel={() => setDialog(null)}
          />
        </Modal>
      )}
    </div>
  );
}
