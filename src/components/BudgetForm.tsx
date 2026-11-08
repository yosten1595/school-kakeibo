"use client";

import { useRef, useState, useTransition } from "react";
import { saveBudgetsAction } from "@/app/budgets/actions";
import { budgetFieldName } from "@/lib/budget";
import { formatMonth, formatYen } from "@/lib/month";
import type { BudgetFormState } from "@/lib/types";

const inputClass =
  "h-[42px] w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-right tabular-nums dark:border-zinc-700 dark:bg-zinc-900";

function BudgetRow({
  name,
  label,
  spent,
  defaultAmount,
  error,
}: {
  name: string;
  label: string;
  spent: number;
  defaultAmount: number | undefined;
  error?: string;
}) {
  const id = `budget-${name}`;
  return (
    <li className="py-2.5">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor={id} className="block truncate font-medium">
            {label}
          </label>
          <div className="text-sm text-zinc-600 tabular-nums dark:text-zinc-400">
            今月の支出 {formatYen(spent)}
          </div>
        </div>
        <div className="flex w-40 shrink-0 items-center gap-1.5">
          <input
            id={id}
            name={name}
            inputMode="numeric"
            autoComplete="off"
            placeholder="予算なし"
            defaultValue={defaultAmount ?? ""}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={inputClass}
          />
          <span className="text-sm">円</span>
        </div>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-right text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </li>
  );
}

/** 1か月分の予算（全体と、支出カテゴリごと）をまとめて編集する。空欄は「予算なし」 */
export function BudgetForm({
  month,
  previousMonth,
  categories,
  totalSpent,
  amounts,
  previousAmounts,
}: {
  month: string;
  previousMonth: string;
  categories: { id: number; name: string; spent: number }[];
  totalSpent: number;
  amounts: Record<string, number>;
  previousAmounts: Record<string, number>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<BudgetFormState>({});
  const [pending, startTransition] = useTransition();
  const errors = state.errors ?? {};
  const hasPrevious = Object.keys(previousAmounts).length > 0;

  /** 前月の予算を入力欄に入れる（前月に予算がない項目は空欄にする）。保存はしない */
  function fillFromPrevious() {
    const form = formRef.current;
    if (!form) return;
    for (const name of [budgetFieldName(null), ...categories.map((c) => budgetFieldName(c.id))]) {
      const input = form.elements.namedItem(name);
      if (input instanceof HTMLInputElement) input.value = String(previousAmounts[name] ?? "");
    }
    setState({});
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => setState(await saveBudgetsAction(month, formData)));
      }}
      onChange={() => state.saved && setState({})}
      className="flex flex-col gap-4"
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {formatMonth(month)}の予算を入力します。空欄にした項目は予算なしになります。
      </p>

      {errors.form && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">
          {errors.form}
        </p>
      )}

      <section>
        <h2 className="mb-1 font-semibold">全体</h2>
        <ul className="rounded-lg border border-zinc-200 px-3 dark:border-zinc-800">
          <BudgetRow
            name={budgetFieldName(null)}
            label="月全体の予算"
            spent={totalSpent}
            defaultAmount={amounts[budgetFieldName(null)]}
            error={errors[budgetFieldName(null)]}
          />
        </ul>
      </section>

      <section>
        <h2 className="mb-1 font-semibold">カテゴリ別</h2>
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 px-3 dark:divide-zinc-800 dark:border-zinc-800">
          {categories.map((c) => (
            <BudgetRow
              key={c.id}
              name={budgetFieldName(c.id)}
              label={c.name}
              spent={c.spent}
              defaultAmount={amounts[budgetFieldName(c.id)]}
              error={errors[budgetFieldName(c.id)]}
            />
          ))}
        </ul>
      </section>

      {Object.keys(errors).some((k) => k !== "form") && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          入力に誤りがあります。赤字の項目を直してください
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "保存中..." : "保存する"}
        </button>
        {hasPrevious && (
          <button
            type="button"
            onClick={fillFromPrevious}
            className="rounded-md border border-zinc-300 px-4 py-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {formatMonth(previousMonth)}の予算を入れる
          </button>
        )}
        <span role="status" className="text-sm text-green-700 dark:text-green-400">
          {state.saved ? "保存しました" : ""}
        </span>
      </div>
    </form>
  );
}
