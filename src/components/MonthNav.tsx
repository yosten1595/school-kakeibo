import Link from "next/link";
import { formatMonth, shiftMonth } from "@/lib/month";

/**
 * 「← 前月  2026年11月  翌月 →」。basePath に ?month=YYYY-MM を付けて移動する。
 * query を渡すと、移動先にもその search params（絞り込み条件など）を引き継ぐ。
 */
export function MonthNav({
  month,
  basePath,
  query = {},
}: {
  month: string;
  basePath: string;
  query?: Record<string, string>;
}) {
  const linkClass = "rounded px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800";
  const href = (delta: number) =>
    `${basePath}?${new URLSearchParams({ month: shiftMonth(month, delta), ...query })}`;
  return (
    <div className="flex items-center justify-between">
      <Link href={href(-1)} className={linkClass}>
        ← 前月
      </Link>
      <h2 className="text-lg font-semibold">{formatMonth(month)}</h2>
      <Link href={href(1)} className={linkClass}>
        翌月 →
      </Link>
    </div>
  );
}
