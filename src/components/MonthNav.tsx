import Link from "next/link";
import { formatMonth, isMonth, shiftMonth } from "@/lib/month";

const linkClass = "rounded px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800";
const disabledClass = "rounded px-3 py-1 text-zinc-400 dark:text-zinc-600";

/**
 * 「← 前月  2026年11月  翌月 →」。basePath に ?month=YYYY-MM を付けて移動する。
 * query を渡すと、移動先にもその search params（絞り込み条件など）を引き継ぐ。
 * 表示できる範囲の端では、その先へのリンクを出さない。
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
  const link = (delta: number, label: string) => {
    const target = shiftMonth(month, delta);
    if (!isMonth(target)) {
      return (
        <span aria-disabled="true" title="これより先は表示できません" className={disabledClass}>
          {label}
        </span>
      );
    }
    return (
      <Link href={`${basePath}?${new URLSearchParams({ month: target, ...query })}`} className={linkClass}>
        {label}
      </Link>
    );
  };
  return (
    <div className="flex items-center justify-between">
      {link(-1, "← 前月")}
      <h2 className="text-lg font-semibold">{formatMonth(month)}</h2>
      {link(1, "翌月 →")}
    </div>
  );
}
