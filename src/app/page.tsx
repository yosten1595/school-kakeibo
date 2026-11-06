import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ExpenseBreakdown } from "@/components/ExpenseBreakdown";
import { MonthNav } from "@/components/MonthNav";
import {
  getExpenseByCategory,
  getMonthlySummary,
  listTransactionsByMonth,
} from "@/lib/db/transactions";
import { formatSignedYen, formatYen, parseMonth } from "@/lib/month";

const RECENT_COUNT = 5;

function SummaryCard({
  label,
  value,
  tone,
  testId,
}: {
  label: string;
  value: string;
  tone: string;
  testId: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="text-sm text-zinc-600 dark:text-zinc-400">{label}</div>
      <div data-testid={testId} className={`mt-1 text-2xl font-bold tabular-nums ${tone}`}>
        {value}
      </div>
    </div>
  );
}

async function Dashboard({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
  await connection(); // 月の指定がないときは「今日」から今月を決めるため、毎回のリクエストで処理する
  const month = parseMonth((await searchParams).month);
  const [summary, transactions, expenseByCategory] = await Promise.all([
    getMonthlySummary(month),
    listTransactionsByMonth(month),
    getExpenseByCategory(month),
  ]);
  const recent = transactions.slice(0, RECENT_COUNT);

  const balanceTone =
    summary.balance < 0
      ? "text-red-700 dark:text-red-400"
      : "text-green-700 dark:text-green-400";

  return (
    <div className="flex flex-col gap-5">
      <MonthNav month={month} basePath="/" />

      <section aria-label="月次サマリー" className="grid grid-cols-2 gap-3">
        <SummaryCard
          label="収入"
          value={formatYen(summary.income)}
          tone="text-blue-700 dark:text-blue-400"
          testId="summary-income"
        />
        <SummaryCard
          label="支出"
          value={formatYen(summary.expense)}
          tone="text-red-700 dark:text-red-400"
          testId="summary-expense"
        />
        <div className="col-span-2">
          <SummaryCard
            label="差額（収入 − 支出）"
            value={formatSignedYen(summary.balance)}
            tone={balanceTone}
            testId="summary-balance"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">カテゴリ別の支出</h2>
        <ExpenseBreakdown categories={expenseByCategory} expense={summary.expense} />
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">直近の収支</h2>
          <Link
            href={`/transactions?month=${month}`}
            className="text-sm text-blue-700 hover:underline dark:text-blue-400"
          >
            すべて見る・登録する →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
            この月の収支はまだありません
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center gap-3 p-3">
                <div className="w-14 shrink-0 text-sm text-zinc-600 dark:text-zinc-400">
                  {t.date.slice(5).replace("-", "/")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{t.categoryName}</div>
                  {t.memo && (
                    <div className="truncate text-sm text-zinc-600 dark:text-zinc-400">
                      {t.memo}
                    </div>
                  )}
                </div>
                <div
                  className={`shrink-0 font-semibold tabular-nums ${
                    t.type === "income"
                      ? "text-blue-700 dark:text-blue-400"
                      : "text-red-700 dark:text-red-400"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatYen(t.amount)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function Home(props: PageProps<"/">) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>
      <Suspense fallback={<p>読み込み中...</p>}>
        <Dashboard searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
