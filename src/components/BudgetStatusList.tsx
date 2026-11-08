import Link from "next/link";
import { budgetStatus, formatUsage, type BudgetStatus } from "@/lib/budget";
import { formatYen } from "@/lib/month";
import type { Budget, CategoryExpense } from "@/lib/types";

interface Row {
  key: string;
  label: string;
  used: number;
  budget: number;
  status: BudgetStatus;
}

const FILL: Record<BudgetStatus, string> = {
  ok: "var(--series-1)",
  warning: "var(--status-warning)",
  over: "var(--status-critical)",
};

/** 状態は色だけでなく、記号とラベルでも示す */
function StatusBadge({ status }: { status: BudgetStatus }) {
  if (status === "ok") return null;
  return status === "over" ? (
    <span className="shrink-0 rounded px-1.5 py-0.5 text-xs font-bold text-white" style={{ background: "var(--status-critical)" }}>
      ⚠ 超過
    </span>
  ) : (
    <span className="shrink-0 rounded px-1.5 py-0.5 text-xs font-bold text-[#0b0b0b]" style={{ background: "var(--status-warning)" }}>
      ⚠ 注意
    </span>
  );
}

function UsageRow({ row }: { row: Row }) {
  const width = Math.min(row.used / row.budget, 1) * 100;
  return (
    <li data-testid="budget-row" data-status={row.status} className="flex flex-col gap-1.5 p-3">
      <div className="flex items-center gap-2">
        <span className="min-w-0 truncate font-medium">{row.label}</span>
        <StatusBadge status={row.status} />
        <span className="ml-auto shrink-0 text-sm tabular-nums">
          {formatYen(row.used)}
          <span className="text-zinc-600 dark:text-zinc-400"> / {formatYen(row.budget)}</span>
        </span>
      </div>
      <div
        role="meter"
        aria-label={`${row.label}の予算の使用率`}
        aria-valuemin={0}
        aria-valuemax={row.budget}
        aria-valuenow={Math.min(row.used, row.budget)}
        aria-valuetext={formatUsage(row.used, row.budget)}
        className="h-2 overflow-hidden rounded-full"
        style={{ background: "var(--chart-grid)" }}
      >
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: FILL[row.status] }} />
      </div>
      <div className="flex justify-between text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
        <span>{formatUsage(row.used, row.budget)}</span>
        <span>
          {row.used > row.budget
            ? `${formatYen(row.used - row.budget)} 超過`
            : `残り ${formatYen(row.budget - row.used)}`}
        </span>
      </div>
    </li>
  );
}

/** ダッシュボードの予算の使用状況。全体を先頭に、カテゴリ別は使用率の高い順 */
export function BudgetStatusList({
  month,
  budgets,
  expenses,
  totalExpense,
}: {
  month: string;
  budgets: Budget[];
  expenses: CategoryExpense[];
  totalExpense: number;
}) {
  if (budgets.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        この月の予算は未設定です。
        <Link href={`/budgets?month=${month}`} className="ml-1 text-blue-700 hover:underline dark:text-blue-400">
          予算を設定する →
        </Link>
      </p>
    );
  }

  const spent = new Map(expenses.map((e) => [e.categoryId, e.total]));
  const toRow = (b: Budget): Row => {
    const used = b.categoryId === null ? totalExpense : (spent.get(b.categoryId) ?? 0);
    return {
      key: String(b.categoryId ?? "total"),
      label: b.categoryId === null ? "全体" : (b.categoryName ?? ""),
      used,
      budget: b.amount,
      status: budgetStatus(used, b.amount),
    };
  };
  const total = budgets.filter((b) => b.categoryId === null).map(toRow);
  const byCategory = budgets
    .filter((b) => b.categoryId !== null)
    .map(toRow)
    .sort((a, b) => b.used / b.budget - a.used / a.budget);
  const rows = [...total, ...byCategory];
  const over = rows.filter((r) => r.status === "over");
  const warning = rows.filter((r) => r.status === "warning");

  return (
    <div className="flex flex-col gap-3">
      {(over.length > 0 || warning.length > 0) && (
        <div data-testid="budget-alert" role="status" className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
          {over.length > 0 && (
            <p className="flex items-start gap-2">
              <StatusBadge status="over" />
              <span>予算を超えています: {over.map((r) => r.label).join("、")}</span>
            </p>
          )}
          {warning.length > 0 && (
            <p className="flex items-start gap-2">
              <StatusBadge status="warning" />
              <span>予算の 80% 以上を使っています: {warning.map((r) => r.label).join("、")}</span>
            </p>
          )}
        </div>
      )}
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {rows.map((r) => (
          <UsageRow key={r.key} row={r} />
        ))}
      </ul>
    </div>
  );
}
