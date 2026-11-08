"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import {
  isFiltered,
  MAX_KEYWORD_LENGTH,
  parseTransactionFilter,
  transactionsHref,
} from "@/lib/transaction-filter";
import type { Category, TransactionFilter } from "@/lib/types";

const KEYWORD_DELAY_MS = 300; // 入力が止まってから一覧を更新するまでの待ち時間

const fieldClass =
  "h-[42px] w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";
const labelClass = "mb-1 block text-sm text-zinc-600 dark:text-zinc-400";

/**
 * 収支一覧の絞り込み。種別・カテゴリは選んだ時点で、キーワードは入力中に一覧へ反映する。
 * 条件は URL（?month=&q=&type=&category=）に入れる。履歴は増やさない（replace）。
 */
export function TransactionFilterForm({
  month,
  filter,
  categories,
}: {
  month: string;
  filter: TransactionFilter;
  categories: Category[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const keywordRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // URL の条件が外から変わったとき（戻る操作など）に入力欄を合わせる。
  // キーワードは入力中に上書きすると打った文字が消えるので、入力欄にフォーカスがないときだけ合わせる。
  useEffect(() => {
    const input = keywordRef.current;
    if (input && document.activeElement !== input) input.value = filter.keyword;
  }, [filter.keyword]);
  useEffect(() => {
    if (typeRef.current) typeRef.current.value = filter.type ?? "";
    if (categoryRef.current) {
      categoryRef.current.value = filter.categoryId === null ? "" : String(filter.categoryId);
    }
  }, [filter.type, filter.categoryId]);
  useEffect(() => () => cancelPending(), []);

  function cancelPending() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  function navigate(next: TransactionFilter) {
    cancelPending();
    startTransition(() => router.replace(transactionsHref(month, next), { scroll: false }));
  }

  /** フォームの今の値で一覧を更新する */
  function apply() {
    const data = new FormData(formRef.current ?? undefined);
    const value = (name: string) => String(data.get(name) ?? "");
    navigate(
      parseTransactionFilter({ q: value("q"), type: value("type"), category: value("category") }),
    );
  }

  function applyKeywordLater() {
    cancelPending();
    timerRef.current = setTimeout(apply, KEYWORD_DELAY_MS);
  }

  function clear() {
    if (keywordRef.current) keywordRef.current.value = "";
    if (typeRef.current) typeRef.current.value = "";
    if (categoryRef.current) categoryRef.current.value = "";
    navigate({ keyword: "", type: null, categoryId: null });
  }

  const groups = [
    { label: "支出", items: categories.filter((c) => c.type === "expense") },
    { label: "収入", items: categories.filter((c) => c.type === "income") },
  ];

  return (
    <form
      ref={formRef}
      action="/transactions"
      role="search"
      aria-label="収支の絞り込み"
      onSubmit={(e) => {
        e.preventDefault(); // Enter でもすぐに反映する（入力中の反映と結果は同じ）
        apply();
      }}
      className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
    >
      <input type="hidden" name="month" value={month} />
      <div>
        <label htmlFor="filter-type" className={labelClass}>
          種別
        </label>
        <select
          ref={typeRef}
          id="filter-type"
          name="type"
          defaultValue={filter.type ?? ""}
          onChange={apply}
          className={`${fieldClass} select-field`}
        >
          <option value="">すべて</option>
          <option value="expense">支出</option>
          <option value="income">収入</option>
        </select>
      </div>
      <div>
        <label htmlFor="filter-category" className={labelClass}>
          カテゴリ
        </label>
        <select
          ref={categoryRef}
          id="filter-category"
          name="category"
          defaultValue={filter.categoryId === null ? "" : String(filter.categoryId)}
          onChange={apply}
          className={`${fieldClass} select-field`}
        >
          <option value="">すべて</option>
          {groups.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="filter-q" className="text-sm text-zinc-600 dark:text-zinc-400">
            キーワード（メモ）
          </label>
          <span aria-live="polite" className="text-xs text-zinc-500 dark:text-zinc-400">
            {isPending ? "検索中…" : ""}
          </span>
        </div>
        <div className="flex gap-2">
          <input
            ref={keywordRef}
            id="filter-q"
            type="search"
            name="q"
            defaultValue={filter.keyword}
            maxLength={MAX_KEYWORD_LENGTH}
            placeholder="例: コンビニ"
            autoComplete="off"
            onChange={applyKeywordLater}
            className={fieldClass}
          />
          {isFiltered(filter) && (
            <button
              type="button"
              onClick={clear}
              className="h-[42px] shrink-0 rounded-md border border-zinc-300 px-3 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              クリア
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
