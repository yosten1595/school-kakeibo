"use client";

import { Pie, PieChart, Tooltip } from "recharts";
import type { PieLabelRenderProps, TooltipContentProps } from "recharts";
import { formatYen } from "@/lib/month";
import type { CategoryExpense } from "@/lib/types";

const SERIES_COUNT = 8; // globals.css の --series-1〜8
const OTHER_COLOR = "var(--series-other)";
const LABEL_MIN_PERCENT = 0.06; // これより小さいスライスには、重なるのでラベルを付けない

interface Row extends CategoryExpense {
  color: string;
  percent: number;
}

interface Slice {
  name: string;
  value: number;
  fill: string;
}

/** 色はカテゴリの登録順で固定する（月や金額の順位で変わらないように）。色が足りない分は灰色 */
function toRows(categories: CategoryExpense[], expense: number): Row[] {
  return categories
    .map((c, i) => ({
      ...c,
      color: i < SERIES_COUNT ? `var(--series-${i + 1})` : OTHER_COLOR,
      percent: c.total / expense,
    }))
    .filter((r) => r.total > 0);
}

/** 灰色のカテゴリは 1 つのスライスにまとめる。一覧には個別に出るので内訳は読み取れる */
function toSlices(rows: Row[]): Slice[] {
  const colored = rows.filter((r) => r.color !== OTHER_COLOR);
  const others = rows.filter((r) => r.color === OTHER_COLOR);
  const slices = colored.map((r) => ({ name: r.categoryName, value: r.total, fill: r.color }));
  if (others.length > 0) {
    slices.push({
      name: others.length === 1 ? others[0].categoryName : `ほか${others.length}カテゴリ`,
      value: others.reduce((sum, r) => sum + r.total, 0),
      fill: OTHER_COLOR,
    });
  }
  return slices;
}

function formatPercent(ratio: number): string {
  return ratio < 0.01 ? "1%未満" : `${Math.round(ratio * 100)}%`;
}

function SliceLabel({ x, y, textAnchor, name, percent }: PieLabelRenderProps) {
  if (percent === undefined || percent < LABEL_MIN_PERCENT) return null;
  return (
    <text x={x} y={y} textAnchor={textAnchor} fill="var(--foreground)" fontSize={12}>
      <tspan x={x} dy="-0.2em">
        {name}
      </tspan>
      <tspan x={x} dy="1.2em" fill="var(--chart-muted)">
        {formatPercent(percent)}
      </tspan>
    </text>
  );
}

function SliceTooltip({ active, payload, expense }: TooltipContentProps & { expense: number }) {
  const item = payload?.[0];
  if (!active || !item) return null;
  const value = Number(item.value);
  return (
    <div className="rounded border border-zinc-200 bg-background px-3 py-2 text-sm shadow-sm dark:border-zinc-700">
      <div className="font-medium">{item.name}</div>
      <div className="tabular-nums">
        {formatYen(value)}（{formatPercent(value / expense)}）
      </div>
    </div>
  );
}

/** 指定した月の支出のカテゴリ別内訳。円グラフと、金額の大きい順の一覧で表示する */
export function ExpenseBreakdown({
  categories,
  expense,
}: {
  categories: CategoryExpense[];
  expense: number;
}) {
  if (expense === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        この月の支出はまだありません
      </p>
    );
  }

  const rows = toRows(categories, expense);
  const ranked = [...rows].sort((a, b) => b.total - a.total);

  return (
    <div className="grid gap-4 rounded-lg border border-zinc-200 p-4 sm:grid-cols-2 sm:items-center dark:border-zinc-800">
      <div data-testid="expense-pie">
        <PieChart
          responsive
          style={{ width: "100%", height: 240 }}
          role="img"
          aria-label="支出のカテゴリ別内訳の円グラフ。金額は一覧を参照"
        >
          {/* スライスはカテゴリの登録順に固定し、月を切り替えても並びと色が変わらないようにする */}
          <Pie
            data={toSlices(rows)}
            dataKey="value"
            nameKey="name"
            outerRadius="62%"
            startAngle={90}
            endAngle={-270}
            stroke="var(--background)"
            strokeWidth={2}
            isAnimationActive={false}
            label={SliceLabel}
            labelLine={false}
          />
          <Tooltip content={(props) => <SliceTooltip {...props} expense={expense} />} />
        </PieChart>
      </div>
      <ul data-testid="expense-list" className="flex flex-col gap-1.5 text-sm">
        {ranked.map((r) => (
          <li key={r.categoryId} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-sm"
              style={{ backgroundColor: r.color }}
            />
            <span className="min-w-0 flex-1 truncate">{r.categoryName}</span>
            <span className="shrink-0 font-medium tabular-nums">{formatYen(r.total)}</span>
            <span className="w-12 shrink-0 text-right text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
              {formatPercent(r.percent)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
