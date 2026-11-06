import { formatYen } from "@/lib/month";
import type { CategoryYearlyExpense, MonthlyTotal } from "@/lib/types";

const HEAT_LEVELS = 5; // globals.css の .heat-1〜5

/**
 * 色の段階（1〜5）。全マス共通の基準にして、カテゴリをまたいで濃さを比べられるようにする。
 * 平方根をとるのは、家賃のような大きな固定費があっても、小さな金額の差が色に出るようにするため。
 */
function heatLevel(amount: number, max: number): number {
  return Math.max(1, Math.ceil(Math.sqrt(amount / max) * HEAT_LEVELS));
}

/** 表の幅に収めるため、万円で表示する。正確な金額はマスの title で確認できる */
function formatMan(amount: number): string {
  return amount < 500 ? "<0.1" : (amount / 10000).toFixed(1);
}

const EMPTY = <span className="text-zinc-400 dark:text-zinc-600">-</span>;

/** 縦がカテゴリ、横が月の支出の表。カテゴリは年間の支出が大きい順 */
export function YearlyCategoryTable({
  year,
  categories,
  months,
}: {
  year: string;
  categories: CategoryYearlyExpense[];
  months: MonthlyTotal[];
}) {
  if (categories.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        この年の支出はまだありません
      </p>
    );
  }

  const max = Math.max(...categories.flatMap((c) => c.months));
  const yearTotal = categories.reduce((sum, c) => sum + c.total, 0);
  // 枠に左の余白を持たせると、スクロールした月がその余白にのぞくので、余白はこの列に持たせる
  const stickyColumn = "sticky left-0 z-10 max-w-24 truncate bg-background py-1.5 pl-3 pr-2 text-left";
  const totalColumn = "py-1.5 pl-1 pr-3 text-right tabular-nums";

  return (
    <div className="flex flex-col gap-2">
      <div
        role="region"
        aria-label="カテゴリ別・月別の支出の表"
        tabIndex={0}
        className="overflow-x-auto rounded-lg border border-zinc-200 py-2 dark:border-zinc-800"
      >
        <table data-testid="yearly-table" className="w-full min-w-[36rem] border-separate border-spacing-0.5 text-xs">
          <thead>
            <tr>
              <th scope="col" className={`${stickyColumn} font-medium`}>
                カテゴリ
              </th>
              {months.map((m) => (
                <th key={m.month} scope="col" className="px-0.5 py-1.5 text-center font-medium">
                  {m.month}月
                </th>
              ))}
              <th scope="col" className={`${totalColumn} font-medium`}>
                合計
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.categoryId}>
                <th scope="row" title={c.categoryName} className={`${stickyColumn} font-normal`}>
                  {c.categoryName}
                </th>
                {c.months.map((amount, i) => (
                  <td
                    key={i}
                    title={`${year}年${i + 1}月 ${c.categoryName} ${formatYen(amount)}`}
                    data-yen={amount}
                    className={`rounded-sm px-0.5 py-1.5 text-center tabular-nums ${
                      amount > 0 ? `heat-${heatLevel(amount, max)}` : ""
                    }`}
                  >
                    {amount > 0 ? formatMan(amount) : EMPTY}
                  </td>
                ))}
                <td
                  title={`${year}年 ${c.categoryName} ${formatYen(c.total)}`}
                  data-yen={c.total}
                  className={`${totalColumn} font-medium`}
                >
                  {formatMan(c.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className={`${stickyColumn} font-medium`}>
                合計
              </th>
              {months.map((m) => (
                <td
                  key={m.month}
                  title={`${year}年${m.month}月 支出合計 ${formatYen(m.expense)}`}
                  data-yen={m.expense}
                  className="px-0.5 py-1.5 text-center font-medium tabular-nums"
                >
                  {m.expense > 0 ? formatMan(m.expense) : EMPTY}
                </td>
              ))}
              <td
                title={`${year}年 支出合計 ${formatYen(yearTotal)}`}
                data-yen={yearTotal}
                className={`${totalColumn} font-bold`}
              >
                {formatMan(yearTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
        <span>単位: 万円</span>
        <span className="flex items-center gap-1" aria-hidden>
          少ない
          {Array.from({ length: HEAT_LEVELS }, (_, i) => (
            <span key={i} className={`size-3 rounded-sm heat-${i + 1}`} />
          ))}
          多い
        </span>
      </div>
    </div>
  );
}
