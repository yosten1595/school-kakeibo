import { formatSignedYen, formatYen } from "@/lib/month";
import type { WeeklyTotal } from "@/lib/types";
import { formatWeekRange } from "@/lib/week";

const EMPTY = <span className="text-zinc-400 dark:text-zinc-600">-</span>;

/** 週ごとの収入・支出・差額の表（新しい週が上）。差額だけ、プラスは緑・マイナスは赤 */
export function WeeklyTable({ weeks, currentWeek }: { weeks: WeeklyTotal[]; currentWeek: string }) {
  const balanceTone = (balance: number) =>
    balance > 0
      ? "text-green-700 dark:text-green-400"
      : balance < 0
        ? "text-red-700 dark:text-red-400"
        : "";

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table data-testid="weekly-table" className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            <th scope="col" className="px-2 py-2 text-left font-medium sm:px-3">
              週（月〜日）
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium sm:px-3">
              収入
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium sm:px-3">
              支出
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium sm:px-3">
              差額
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {[...weeks].reverse().map((w) => {
            const empty = w.income === 0 && w.expense === 0;
            return (
              <tr key={w.weekStart}>
                <th scope="row" className="whitespace-nowrap px-2 py-2 text-left font-normal sm:px-3">
                  {formatWeekRange(w.weekStart)}
                  {w.weekStart === currentWeek && (
                    <span className="block text-xs text-zinc-600 sm:ml-1.5 sm:inline dark:text-zinc-400">今週</span>
                  )}
                </th>
                <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums sm:px-3">
                  {empty ? EMPTY : formatYen(w.income)}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums sm:px-3">
                  {empty ? EMPTY : formatYen(w.expense)}
                </td>
                <td className={`whitespace-nowrap px-2 py-2 text-right font-medium tabular-nums sm:px-3 ${balanceTone(w.balance)}`}>
                  {empty ? EMPTY : formatSignedYen(w.balance)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
