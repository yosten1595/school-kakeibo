"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import type { Category, TransactionFormState } from "@/lib/types";

type Props = {
  action: (prev: TransactionFormState, formData: FormData) => Promise<TransactionFormState>;
  categories: Category[];
  initial: NonNullable<TransactionFormState["values"]>;
  submitLabel: string;
  cancelHref: string;
};

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-400">
      {message}
    </p>
  ) : null;
}

export function TransactionForm({ action, categories, initial, submitLabel, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState<TransactionFormState, FormData>(action, {
    values: initial,
  });
  const values = state.values ?? initial;
  const errors = state.errors ?? {};

  const [type, setType] = useState(values.type === "income" ? "income" : "expense");
  const [categoryId, setCategoryId] = useState(values.categoryId);

  const options = categories.filter((c) => c.type === type);

  function changeType(next: "income" | "expense") {
    setType(next);
    // 種別を変えたら、合わなくなったカテゴリの選択を外す
    if (!categories.some((c) => String(c.id) === categoryId && c.type === next)) {
      setCategoryId("");
    }
  }

  return (
    <form
      // form の action 属性を使うと、送信後に入力欄が初期化されてしまう（エラー時に入力が消える）。
      // そのため onSubmit で Server Action を呼び、入力欄はそのまま残す。
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="flex flex-col gap-5"
    >
      {errors.form && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">
          {errors.form}
        </p>
      )}

      <fieldset>
        <legend className="mb-1 font-medium">種別</legend>
        <div className="flex gap-3">
          {(["expense", "income"] as const).map((t) => (
            <label
              key={t}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 py-2 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 dark:border-zinc-700 dark:has-[:checked]:bg-blue-950"
            >
              <input
                type="radio"
                name="type"
                value={t}
                checked={type === t}
                onChange={() => changeType(t)}
              />
              {t === "expense" ? "支出" : "収入"}
            </label>
          ))}
        </div>
        <FieldError message={errors.type} />
      </fieldset>

      <div>
        <label htmlFor="date" className="mb-1 block font-medium">日付</label>
        <input id="date" name="date" type="date" required defaultValue={values.date} className={inputClass} />
        <FieldError message={errors.date} />
      </div>

      <div>
        <label htmlFor="amount" className="mb-1 block font-medium">金額（円）</label>
        <input
          id="amount"
          name="amount"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          required
          defaultValue={values.amount}
          className={inputClass}
        />
        <FieldError message={errors.amount} />
      </div>

      <div>
        <label htmlFor="categoryId" className="mb-1 block font-medium">カテゴリ</label>
        <select
          id="categoryId"
          name="categoryId"
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={inputClass}
        >
          <option value="">選択してください</option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <FieldError message={errors.categoryId} />
      </div>

      <div>
        <label htmlFor="memo" className="mb-1 block font-medium">メモ（任意）</label>
        <input id="memo" name="memo" type="text" maxLength={255} defaultValue={values.memo} className={inputClass} />
        <FieldError message={errors.memo} />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "保存中..." : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded-md border border-zinc-300 px-4 py-2 text-center hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
