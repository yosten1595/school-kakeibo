"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Category } from "@/lib/types";

/** 推移グラフで見るカテゴリを選ぶ。選ぶとすぐに URL（?year=&category=）を変えて表示を切り替える */
export function TrendCategorySelect({
  year,
  categoryId,
  categories,
}: {
  year: string;
  categoryId: number | null;
  categories: Category[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const groups = [
    { label: "支出", items: categories.filter((c) => c.type === "expense") },
    { label: "収入", items: categories.filter((c) => c.type === "income") },
  ];

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="trend-category" className="shrink-0 text-sm text-zinc-600 dark:text-zinc-400">
        カテゴリ
      </label>
      <select
        id="trend-category"
        value={categoryId === null ? "" : String(categoryId)}
        onChange={(e) => {
          const params = new URLSearchParams({ year });
          if (e.target.value) params.set("category", e.target.value);
          startTransition(() => router.replace(`/trends?${params}`, { scroll: false }));
        }}
        className="select-field h-[38px] min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 sm:max-w-60 sm:flex-none dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">すべて（収入・支出・差額）</option>
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
      <span aria-live="polite" className="text-xs text-zinc-500 dark:text-zinc-400">
        {isPending ? "読み込み中…" : ""}
      </span>
    </div>
  );
}
