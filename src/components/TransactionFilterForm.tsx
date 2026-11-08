import Form from "next/form";
import Link from "next/link";
import { isFiltered, MAX_KEYWORD_LENGTH, transactionsHref } from "@/lib/transaction-filter";
import type { Category, TransactionFilter } from "@/lib/types";

const fieldClass =
  "h-[42px] w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";
const labelClass = "mb-1 block text-sm text-zinc-600 dark:text-zinc-400";

/** 収支一覧の絞り込み。送信すると条件が URL（?month=&q=&type=&category=）に入る */
export function TransactionFilterForm({
  month,
  filter,
  categories,
}: {
  month: string;
  filter: TransactionFilter;
  categories: Category[];
}) {
  const groups = [
    { label: "支出", items: categories.filter((c) => c.type === "expense") },
    { label: "収入", items: categories.filter((c) => c.type === "income") },
  ];

  return (
    // key: 「クリア」や戻る操作で URL が変わったとき、入力欄を URL の条件で作り直す
    <div key={JSON.stringify(filter)}>
      <Form
        action="/transactions"
        role="search"
        aria-label="収支の絞り込み"
        className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 p-3 sm:grid-cols-[1fr_7rem_9rem_auto] sm:items-end dark:border-zinc-800"
      >
        <input type="hidden" name="month" value={month} />
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="filter-q" className={labelClass}>
            キーワード（メモ）
          </label>
          <input
            id="filter-q"
            type="search"
            name="q"
            defaultValue={filter.keyword}
            maxLength={MAX_KEYWORD_LENGTH}
            placeholder="例: コンビニ"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="filter-type" className={labelClass}>
            種別
          </label>
          <select
            id="filter-type"
            name="type"
            defaultValue={filter.type ?? ""}
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
            id="filter-category"
            name="category"
            defaultValue={filter.categoryId === null ? "" : String(filter.categoryId)}
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
        <div className="col-span-2 flex gap-2 sm:col-span-1">
          <button
            type="submit"
            className="h-[42px] flex-1 rounded-md bg-blue-600 px-4 font-medium text-white hover:bg-blue-700 sm:flex-none"
          >
            絞り込む
          </button>
          {isFiltered(filter) && (
            <Link
              href={transactionsHref(month)}
              className="flex h-[42px] items-center rounded-md border border-zinc-300 px-3 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              クリア
            </Link>
          )}
        </div>
      </Form>
    </div>
  );
}
