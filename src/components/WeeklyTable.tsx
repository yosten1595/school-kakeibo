import { HEAT_LEVELS, heatLevel } from "@/lib/heat";
import { formatSignedYen } from "@/lib/month";
import type { CategoryWeekly, WeeklyBreakdown } from "@/lib/types";
import { addDays, formatMonthDay } from "@/lib/week";

function formatAmount(amount: number): string {
  return amount.toLocaleString("ja-JP");
}

const EMPTY = <span className="text-zinc-400 dark:text-zinc-600">-</span>;

// 枠に左の余白を持たせると、スクロールした週がその余白にのぞくので、余白はこの列に持たせる
// 右の影はセルの間のすき間（border-spacing）をふさぎ、スクロールしたマスがのぞかないようにする
const stickyColumn =
  "sticky left-0 z-10 max-w-28 truncate bg-background py-1.5 pl-3 pr-2 text-left shadow-[2px_0_0_var(--background)]";
const weekColumn = "px-1 py-1.5 text-right tabular-nums";
const totalColumn = "py-1.5 pl-2 pr-3 text-right tabular-nums";

function balanceTone(balance: number): string {
  if (balance > 0) return "text-green-700 dark:text-green-400";
  if (balance < 0) return "text-red-700 dark:text-red-400";
  return "";
}

/** 「収入」「支出」の見出し行 */
function SectionRow({ label, columns }: { label: string; columns: number }) {
  return (
    <tr>
      <th scope="rowgroup" className={`${stickyColumn} pt-4 font-semibold`}>
        {label}
      </th>
      <td colSpan={columns - 1} className="pt-4" />
    </tr>
  );
}

function CategoryRows({ categories, heatMax }: { categories: CategoryWeekly[]; heatMax?: number }) {
  return categories.map((c) => (
    <tr key={c.categoryId}>
      <th scope="row" title={c.categoryName} className={`${stickyColumn} pl-5 font-normal`}>
        {c.categoryName}
      </th>
      {c.weeks.map((amount, i) => (
        <td
          key={i}
          className={`rounded-sm ${weekColumn} ${
            heatMax && amount > 0 ? `heat-${heatLevel(amount, heatMax)}` : ""
          }`}
        >
          {amount > 0 ? formatAmount(amount) : EMPTY}
        </td>
      ))}
      <td className={totalColumn}>{formatAmount(c.total)}</td>
    </tr>
  ));
}

function TotalRow({ label, values, testId }: { label: string; values: number[]; testId: string }) {
  const total = values.reduce((sum, v) => sum + v, 0);
  return (
    <tr data-testid={testId} className="font-medium">
      <th scope="row" className={`${stickyColumn} border-t border-zinc-200 dark:border-zinc-800`}>
        {label}
      </th>
      {values.map((v, i) => (
        <td key={i} className={`${weekColumn} border-t border-zinc-200 dark:border-zinc-800`}>
          {v > 0 ? formatAmount(v) : EMPTY}
        </td>
      ))}
      <td className={`${totalColumn} border-t border-zinc-200 dark:border-zinc-800`}>
        {formatAmount(total)}
      </td>
    </tr>
  );
}

/**
 * 直近の週ごとの収入・支出（カテゴリ別の内訳つき）と差額の表（単位: 円）。
 * 横が週（左が古い）、縦が収入・支出のカテゴリ。支出のマスは金額が大きいほど濃くする。
 */
export function WeeklyTable({ breakdown, currentWeek }: { breakdown: WeeklyBreakdown; currentWeek: string }) {
  const { weeks, income, expense } = breakdown;
  const columns = weeks.length + 2;
  const expenseMax = Math.max(0, ...expense.flatMap((c) => c.weeks));
  const balanceTotal = weeks.reduce((sum, w) => sum + w.balance, 0);

  return (
    <div className="flex flex-col gap-2">
      <div
        role="region"
        aria-label="週ごとの収入・支出の表"
        tabIndex={0}
        className="overflow-x-auto rounded-lg border border-zinc-200 py-2 dark:border-zinc-800"
      >
        <table data-testid="weekly-table" className="w-full min-w-[52rem] border-separate border-spacing-0.5 text-xs">
          <thead>
            <tr>
              <th scope="col" className={`${stickyColumn} align-bottom font-medium`}>
                週（月〜日）
              </th>
              {weeks.map((w) => (
                <th key={w.weekStart} scope="col" className={`${weekColumn} align-bottom font-medium`}>
                  <span className="block">{formatMonthDay(w.weekStart)}</span>
                  <span className="block font-normal text-zinc-600 dark:text-zinc-400">
                    {w.weekStart === currentWeek ? "今週" : `〜${formatMonthDay(addDays(w.weekStart, 6))}`}
                  </span>
                </th>
              ))}
              <th scope="col" className={`${totalColumn} align-bottom font-medium`}>
                合計
              </th>
            </tr>
          </thead>
          <tbody>
            <SectionRow label="収入" columns={columns} />
            <CategoryRows categories={income} />
            <TotalRow label="収入合計" values={weeks.map((w) => w.income)} testId="weekly-income-total" />
            <SectionRow label="支出" columns={columns} />
            <CategoryRows categories={expense} heatMax={expenseMax} />
            <TotalRow label="支出合計" values={weeks.map((w) => w.expense)} testId="weekly-expense-total" />
          </tbody>
          <tfoot>
            <tr data-testid="weekly-balance" className="font-bold">
              <th scope="row" className={`${stickyColumn} pt-4`}>
                差額
              </th>
              {weeks.map((w) => (
                <td key={w.weekStart} className={`${weekColumn} pt-4 ${balanceTone(w.balance)}`}>
                  {w.income === 0 && w.expense === 0 ? EMPTY : formatSignedYen(w.balance).replace("¥", "")}
                </td>
              ))}
              <td className={`${totalColumn} pt-4 ${balanceTone(balanceTotal)}`}>
                {formatSignedYen(balanceTotal).replace("¥", "")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
        <span>単位: 円</span>
        <span className="flex items-center gap-1" aria-hidden>
          支出が少ない
          {Array.from({ length: HEAT_LEVELS }, (_, i) => (
            <span key={i} className={`size-3 rounded-sm heat-${i + 1}`} />
          ))}
          多い
        </span>
      </div>
    </div>
  );
}
