"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { formatSignedYen, formatYen } from "@/lib/month";
import type { MonthlyTotal } from "@/lib/types";

const INCOME_COLOR = "var(--series-1)";
const EXPENSE_COLOR = "var(--series-8)";
const BALANCE_COLOR = "var(--foreground)";

interface Point {
  month: number;
  income: number | null;
  expense: number | null;
  balance: number | null;
}

/** 記録がない月は null にして、棒も折れ線も描かない（0 円と区別する） */
function toPoints(months: MonthlyTotal[]): Point[] {
  return months.map((m) =>
    m.income === 0 && m.expense === 0
      ? { month: m.month, income: null, expense: null, balance: null }
      : m,
  );
}

function formatAxisYen(value: number): string {
  return value === 0 ? "0" : `${value / 10000}万`;
}

/** 縦軸の目盛り。0 を含み、間隔が 1・2・5 × 10^n のきりのいい値になるようにする */
function axisTicks(points: Point[]): number[] {
  const values = points.flatMap((p) => [p.income ?? 0, p.expense ?? 0, p.balance ?? 0]);
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const roughStep = (high - low) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const step = ([1, 2, 5, 10].find((s) => s * magnitude >= roughStep) ?? 10) * magnitude;
  const first = Math.floor(low / step);
  const last = Math.ceil(high / step);
  return Array.from({ length: last - first + 1 }, (_, i) => (first + i) * step);
}

function LegendItem({ color, label, line }: { color: string; label: string; line?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={line ? "h-0.5 w-4 rounded-full" : "size-3 rounded-sm"}
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload as Point | undefined;
  if (!active || !point || point.balance === null) return null;
  return (
    <div className="rounded border border-zinc-200 bg-background px-3 py-2 text-sm shadow-sm dark:border-zinc-700">
      <div className="font-medium">{point.month}月</div>
      <div className="tabular-nums">収入 {formatYen(point.income ?? 0)}</div>
      <div className="tabular-nums">支出 {formatYen(point.expense ?? 0)}</div>
      <div className="tabular-nums">差額 {formatSignedYen(point.balance)}</div>
    </div>
  );
}

/** 選択した年の、月別の収入・支出（棒）と差額（折れ線） */
export function YearlyTrendChart({ months }: { months: MonthlyTotal[] }) {
  const points = toPoints(months);
  const ticks = axisTicks(points);
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <LegendItem color={INCOME_COLOR} label="収入" />
        <LegendItem color={EXPENSE_COLOR} label="支出" />
        <LegendItem color={BALANCE_COLOR} label="差額" line />
      </div>
      <div data-testid="yearly-chart">
        <ComposedChart
          responsive
          data={points}
          style={{ width: "100%", height: 260 }}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          barGap={2}
          role="img"
          aria-label="月別の収入・支出・差額のグラフ。支出の内訳は下の表を参照"
        >
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="month"
            interval={0}
            tick={{ fontSize: 12, fill: "var(--chart-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--chart-grid)" }}
          />
          <YAxis
            width={44}
            ticks={ticks}
            domain={[ticks[0], ticks[ticks.length - 1]]}
            tickFormatter={formatAxisYen}
            tick={{ fontSize: 12, fill: "var(--chart-muted)" }}
            tickLine={false}
            axisLine={false}
          />
          <ReferenceLine y={0} stroke="var(--chart-muted)" />
          <Tooltip content={ChartTooltip} cursor={{ fill: "var(--chart-grid)", opacity: 0.5 }} />
          <Bar
            dataKey="income"
            name="収入"
            fill={INCOME_COLOR}
            maxBarSize={16}
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="expense"
            name="支出"
            fill={EXPENSE_COLOR}
            maxBarSize={16}
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
          <Line
            dataKey="balance"
            name="差額"
            stroke={BALANCE_COLOR}
            strokeWidth={2}
            dot={{ r: 4, fill: BALANCE_COLOR, stroke: "var(--background)", strokeWidth: 2 }}
            activeDot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </div>
    </div>
  );
}
