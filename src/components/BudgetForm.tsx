"use client";

import { type ReactNode, useLayoutEffect, useRef, useState, useTransition } from "react";
import { saveBudgetsAction } from "@/app/budgets/actions";
import { budgetFieldName, formatAmountInput, parseBudgetAmount, positionAfterDigits, sumBudgets } from "@/lib/budget";
import { formatMonth, formatYen } from "@/lib/month";
import type { BudgetFormState } from "@/lib/types";

const inputClass =
  "h-[42px] w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-right tabular-nums dark:border-zinc-700 dark:bg-zinc-900";

/** 予算額を入力欄に入れるときの文字列（3 桁ごとのカンマつき。予算なしは空欄） */
function toInputValue(amount: number | undefined): string {
  return amount === undefined ? "" : formatAmountInput(String(amount));
}

function RowLayout({
  label,
  labelFor,
  note,
  error,
  errorId,
  children,
}: {
  label: string;
  labelFor?: string;
  /** ラベルの下に出す説明。1 項目ずつ別の行に出す */
  note: string[];
  error?: string;
  errorId: string;
  children: ReactNode;
}) {
  return (
    <li className="py-2.5">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          {labelFor ? (
            <label htmlFor={labelFor} className="block truncate font-medium">
              {label}
            </label>
          ) : (
            <div className="truncate font-medium">{label}</div>
          )}
          {note.map((line) => (
            <div key={line} className="text-sm text-zinc-600 tabular-nums dark:text-zinc-400">
              {line}
            </div>
          ))}
        </div>
        <div className="flex w-40 shrink-0 items-center gap-1.5">
          {children}
          <span className="text-sm">円</span>
        </div>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-right text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </li>
  );
}

/**
 * 1か月分の予算をまとめて編集する。空欄は「予算なし」。
 * 月全体の予算は入力せず、カテゴリ別の予算の合計を自動で表示・保存する。
 * 金額は入力中に 3 桁ごとのカンマを自動で付ける。
 */
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
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(categories.map((c) => [budgetFieldName(c.id), toInputValue(amounts[budgetFieldName(c.id)])])),
  );
  const [state, setState] = useState<BudgetFormState>({});
  const [pending, startTransition] = useTransition();
  // カンマを付けた後に、カーソルを入力した数字の直後へ戻すための情報
  const caret = useRef<{ name: string; position: number } | null>(null);
  const errors = state.errors ?? {};
  const hasPrevious = categories.some((c) => previousAmounts[budgetFieldName(c.id)] !== undefined);

  // 入力中の値から合計を出す（数字として読めない欄は数えない。保存時にはエラーになる）
  const total = sumBudgets(
    categories.map((c) => {
      const result = parseBudgetAmount(values[budgetFieldName(c.id)] ?? "");
      return result.ok ? result.amount : null;
    }),
  );

  useLayoutEffect(() => {
    if (!caret.current) return;
    const input = formRef.current?.elements.namedItem(caret.current.name);
    if (input instanceof HTMLInputElement && document.activeElement === input) {
      input.setSelectionRange(caret.current.position, caret.current.position);
    }
    caret.current = null;
  });

  function handleChange(name: string, input: HTMLInputElement) {
    const raw = input.value;
    const formatted = formatAmountInput(raw);
    // カーソルより前にある数字の数を数え、カンマを付けた後も同じ数字の直後にカーソルを置く
    const before = raw.slice(0, input.selectionStart ?? raw.length).normalize("NFKC");
    const digitsBefore = (before.match(/\d/g) ?? []).length;
    caret.current = { name, position: positionAfterDigits(formatted, digitsBefore) };
    setValues((v) => ({ ...v, [name]: formatted }));
    if (state.saved) setState({});
  }

  /** 前月のカテゴリ別の予算を入力欄に入れる（前月に予算がない項目は空欄にする）。保存はしない */
  function fillFromPrevious() {
    setValues(
      Object.fromEntries(
        categories.map((c) => [budgetFieldName(c.id), toInputValue(previousAmounts[budgetFieldName(c.id)])]),
      ),
    );
    setState({});
  }

  const totalName = budgetFieldName(null);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => setState(await saveBudgetsAction(month, formData)));
      }}
      className="flex flex-col gap-4"
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {formatMonth(month)}の予算をカテゴリ別に入力します。月全体の予算は、カテゴリ別の予算の合計になります。空欄にした項目は予算なしになります。
      </p>

      {errors.form && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">
          {errors.form}
        </p>
      )}

      <section>
        <h2 className="mb-1 font-semibold">全体</h2>
        <ul className="rounded-lg border border-zinc-200 px-3 dark:border-zinc-800">
          <RowLayout
            label="月全体の予算"
            note={["カテゴリ別の合計（自動）", `今月の支出 ${formatYen(totalSpent)}`]}
            error={errors[totalName]}
            errorId={`budget-${totalName}-error`}
          >
            <output
              aria-live="polite"
              aria-describedby={errors[totalName] ? `budget-${totalName}-error` : undefined}
              className="flex h-[42px] w-full items-center justify-end rounded-md bg-zinc-100 px-3 py-2 font-semibold tabular-nums dark:bg-zinc-800"
            >
              {total === null ? "予算なし" : total.toLocaleString("ja-JP")}
            </output>
          </RowLayout>
        </ul>
      </section>

      <section>
        <h2 className="mb-1 font-semibold">カテゴリ別</h2>
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 px-3 dark:divide-zinc-800 dark:border-zinc-800">
          {categories.map((c) => {
            const name = budgetFieldName(c.id);
            const id = `budget-${name}`;
            const error = errors[name];
            return (
              <RowLayout
                key={c.id}
                label={c.name}
                labelFor={id}
                note={[`今月の支出 ${formatYen(c.spent)}`]}
                error={error}
                errorId={`${id}-error`}
              >
                <input
                  id={id}
                  name={name}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="予算なし"
                  value={values[name] ?? ""}
                  onChange={(e) => handleChange(name, e.currentTarget)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${id}-error` : undefined}
                  className={inputClass}
                />
              </RowLayout>
            );
          })}
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
