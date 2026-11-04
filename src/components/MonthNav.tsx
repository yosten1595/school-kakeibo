import Link from "next/link";
import { formatMonth, shiftMonth } from "@/lib/month";

/** 「← 前月  2026年11月  翌月 →」。basePath に ?month=YYYY-MM を付けて移動する。 */
export function MonthNav({ month, basePath }: { month: string; basePath: string }) {
  const linkClass = "rounded px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800";
  return (
    <div className="flex items-center justify-between">
      <Link href={`${basePath}?month=${shiftMonth(month, -1)}`} className={linkClass}>
        ← 前月
      </Link>
      <h2 className="text-lg font-semibold">{formatMonth(month)}</h2>
      <Link href={`${basePath}?month=${shiftMonth(month, 1)}`} className={linkClass}>
        翌月 →
      </Link>
    </div>
  );
}
