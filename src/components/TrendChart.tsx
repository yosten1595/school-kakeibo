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
import type { TransactionType } from "@/lib/types";

const INCOME_COLOR = "var(--series-1)";
const EXPENSE_COLOR = "var(--series-8)";
const BALANCE_COLOR = "var(--foreground)";

/** グラフの 1 区間（1 か月など）。label は横軸、title はツールチップの見出し */
export interface TrendPoint {
  label: string;
  title: string;
  income: number;
  expense: number;
}

interface Point {
  label: string;
  title: string;
  income: number | null;
  expense: number | null;
  balance: number | null;
}

/**
 * 記録がない区間は null にして、棒も折れ線も描かない（0 円と区別する）。
 * only を指定したときは、その種別の金額だけで判定する。
 */
function toPoints(points: TrendPoint[], only?: TransactionType): Point[] {
  return points.map((p) => {
    const empty = only ? p[only] === 0 : p.income === 0 && p.expense === 0;
    return empty
      ? { ...p, income: null, expense: null, balance: null }
      : { ...p, balance: p.income - p.expense };
  });
}

function formatAxisYen(value: number): string {
  return value === 0 ? "0" : `${value / 10000}万`;
}

/** 縦軸の目盛り。0 を含み、間隔が 1・2・5 × 10^n のきりのいい値になるようにする */
function axisTicks(values: number[]): number[] {
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  if (high === low) return [0, 10000];
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

function ChartTooltip({ active, payload, only }: TooltipContentProps & { only?: TransactionType }) {
  const point = payload?.[0]?.payload as Point | undefined;
  if (!active || !point || point.balance === null) return null;
  return (
    <div className="rounded border border-zinc-200 bg-background px-3 py-2 text-sm shadow-sm dark:border-zinc-700">
      <div className="font-medium">{point.title}</div>
      {only ? (
        <div className="tabular-nums">{formatYen(point[only] ?? 0)}</div>
      ) : (
        <>
          <div className="tabular-nums">収入 {formatYen(point.income ?? 0)}</div>
          <div className="tabular-nums">支出 {formatYen(point.expense ?? 0)}</div>
          <div className="tabular-nums">差額 {formatSignedYen(point.balance)}</div>
        </>
      )}
    </div>
  );
}

/**
 * 区間ごと（1 か月など）の収入・支出（棒）と差額（折れ線）。
 * only を指定すると、その種別の棒だけを描く（カテゴリ 1 つの推移など）。系列が 1 つなので凡例は出さない
 */
export function TrendChart({
  points,
  ariaLabel,
  testId,
  only,
}: {
  points: TrendPoint[];
  ariaLabel: string;
  testId: string;
  only?: TransactionType;
}) {
  const data = toPoints(points, only);
  const ticks = axisTicks(
    data.flatMap((p) => (only ? [p[only] ?? 0] : [p.income ?? 0, p.expense ?? 0, p.balance ?? 0])),
  );
  const bar = (type: TransactionType) => (
    <Bar
      dataKey={type}
      name={type === "income" ? "収入" : "支出"}
      fill={type === "income" ? INCOME_COLOR : EXPENSE_COLOR}
      maxBarSize={only ? 24 : 16}
      radius={[2, 2, 0, 0]}
      isAnimationActive={false}
    />
  );
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      {!only && (
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <LegendItem color={INCOME_COLOR} label="収入" />
          <LegendItem color={EXPENSE_COLOR} label="支出" />
          <LegendItem color={BALANCE_COLOR} label="差額" line />
        </div>
      )}
      <div data-testid={testId}>
        <ComposedChart
          responsive
          data={data}
          style={{ width: "100%", height: 260 }}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          barGap={2}
          role="img"
          aria-label={ariaLabel}
        >
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="label"
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
          <Tooltip
            content={(props) => <ChartTooltip {...props} only={only} />}
            cursor={{ fill: "var(--chart-grid)", opacity: 0.5 }}
          />
          {only ? bar(only) : bar("income")}
          {!only && bar("expense")}
          {!only && (
            <Line
              dataKey="balance"
              name="差額"
              stroke={BALANCE_COLOR}
              strokeWidth={2}
              dot={{ r: 4, fill: BALANCE_COLOR, stroke: "var(--background)", strokeWidth: 2 }}
              activeDot={false}
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </div>
    </div>
  );
}
