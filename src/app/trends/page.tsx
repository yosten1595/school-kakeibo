import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { TrendCategorySelect } from "@/components/TrendCategorySelect";
import { TrendChart } from "@/components/TrendChart";
import { WeeklyTable } from "@/components/WeeklyTable";
import { YearlyCategoryTable } from "@/components/YearlyCategoryTable";
import { listCategories } from "@/lib/db/categories";
import { getCategoryMonthly, getWeeklyBreakdown, getYearlyOverview } from "@/lib/db/transactions";
import { formatYen, parseYear, shiftYear, today } from "@/lib/month";
import type { Category, MonthlyTotal } from "@/lib/types";
import { addDays, formatMonthDay, formatWeekRange, weekStart } from "@/lib/week";

const WEEK_COUNT = 12;

type View = "yearly" | "weekly";

const emptyClass =
  "rounded-lg border border-dashed border-zinc-300 p-6 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400";

/** 「年間 / 週別」の切り替え。年間に戻るときは、見ていた年を引き継ぐ */
function ViewTabs({ view, year }: { view: View; year: string }) {
  const tabs: { view: View; label: string; href: string }[] = [
    { view: "yearly", label: "年間", href: `/trends?year=${year}` },
    { view: "weekly", label: `週別（直近${WEEK_COUNT}週）`, href: `/trends?view=weekly&year=${year}` },
  ];
  return (
    <nav aria-label="表示の切り替え" className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
      {tabs.map((t) => (
        <Link
          key={t.view}
          href={t.href}
          aria-current={t.view === view ? "page" : undefined}
          className={`flex-1 rounded-md px-3 py-1.5 text-center text-sm ${
            t.view === view
              ? "bg-background font-semibold shadow-sm"
              : "text-zinc-600 hover:text-foreground dark:text-zinc-400"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/** 前年・翌年への移動。選んでいるカテゴリは引き継ぐ */
function YearNav({ year, category }: { year: string; category: Category | null }) {
  const linkClass = "rounded px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800";
  const href = (y: string) =>
    `/trends?${new URLSearchParams({ year: y, ...(category ? { category: String(category.id) } : {}) })}`;
  return (
    <div className="flex items-center justify-between">
      <Link href={href(shiftYear(year, -1))} className={linkClass}>
        ← 前年
      </Link>
      <h2 className="text-lg font-semibold">{year}年</h2>
      <Link href={href(shiftYear(year, 1))} className={linkClass}>
        翌年 →
      </Link>
    </div>
  );
}

/** 月別の推移。カテゴリを選んでいれば、そのカテゴリだけの月別の金額（F-13） */
async function MonthlyTrend({
  year,
  months,
  category,
}: {
  year: string;
  months: MonthlyTotal[];
  category: Category | null;
}) {
  if (!category) {
    return (
      <TrendChart
        points={months.map((m) => ({
          label: String(m.month),
          title: `${year}年${m.month}月`,
          income: m.income,
          expense: m.expense,
        }))}
        ariaLabel="月別の収入・支出・差額のグラフ。支出の内訳は下の表を参照"
        testId="yearly-chart"
      />
    );
  }

  const amounts = await getCategoryMonthly(year, category.id);
  const total = amounts.reduce((sum, a) => sum + a, 0);
  const kind = category.type === "income" ? "収入" : "支出";
  if (total === 0) {
    return <p className={emptyClass}>{year}年は「{category.name}」の{kind}がありません</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      <p data-testid="category-total" className="text-sm">
        {year}年の合計 <span className="font-semibold tabular-nums">{formatYen(total)}</span>
      </p>
      <TrendChart
        points={amounts.map((amount, i) => ({
          label: String(i + 1),
          title: `${year}年${i + 1}月 ${category.name}`,
          income: category.type === "income" ? amount : 0,
          expense: category.type === "expense" ? amount : 0,
        }))}
        only={category.type}
        ariaLabel={`「${category.name}」の月別の${kind}のグラフ`}
        testId="yearly-chart"
      />
    </div>
  );
}

async function YearlyView({ year, categoryParam }: { year: string; categoryParam: unknown }) {
  const [{ months, categories }, allCategories] = await Promise.all([
    getYearlyOverview(year),
    listCategories(),
  ]);
  // 存在しないカテゴリなど不正な値は「すべて」として扱う
  const category =
    typeof categoryParam === "string"
      ? (allCategories.find((c) => String(c.id) === categoryParam) ?? null)
      : null;
  const hasData = months.some((m) => m.income > 0 || m.expense > 0);
  return (
    <>
      <YearNav year={year} category={category} />
      {hasData ? (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="font-semibold">
              {category
                ? `「${category.name}」の月別の${category.type === "income" ? "収入" : "支出"}`
                : "月別の収支"}
            </h2>
            <TrendCategorySelect
              year={year}
              categoryId={category?.id ?? null}
              categories={allCategories}
            />
            <MonthlyTrend year={year} months={months} category={category} />
          </section>
          <section>
            <h2 className="mb-2 font-semibold">カテゴリ別・月別の支出</h2>
            <YearlyCategoryTable categories={categories} months={months} />
          </section>
        </>
      ) : (
        <p className={emptyClass}>この年の収支はまだありません</p>
      )}
    </>
  );
}

async function WeeklyView() {
  const date = today();
  const breakdown = await getWeeklyBreakdown(date, WEEK_COUNT);
  const { weeks } = breakdown;
  const hasData = weeks.some((w) => w.income > 0 || w.expense > 0);
  const first = weeks[0].weekStart;
  const last = weeks[weeks.length - 1].weekStart;
  return (
    <>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {first.slice(0, 4)}年{formatMonthDay(first)}〜{addDays(last, 6).slice(0, 4)}年
        {formatMonthDay(addDays(last, 6))}（週は月曜始まり。今週は {formatWeekRange(last)}）
      </p>
      {hasData ? (
        <section>
          <h2 className="mb-2 font-semibold">週ごとの収入・支出</h2>
          <WeeklyTable breakdown={breakdown} currentWeek={weekStart(date)} />
        </section>
      ) : (
        <p className={emptyClass}>直近{WEEK_COUNT}週の収支はまだありません</p>
      )}
    </>
  );
}

async function Trends({ searchParams }: { searchParams: PageProps<"/trends">["searchParams"] }) {
  await connection(); // 年や週を「今日」から決めるため、毎回のリクエストで処理する
  const params = await searchParams;
  const view: View = params.view === "weekly" ? "weekly" : "yearly";
  const year = parseYear(params.year);
  return (
    <div className="flex flex-col gap-5">
      <ViewTabs view={view} year={year} />
      {view === "weekly" ? <WeeklyView /> : <YearlyView year={year} categoryParam={params.category} />}
    </div>
  );
}

export default function TrendsPage(props: PageProps<"/trends">) {
  // 表に全桁の金額を 12 か月分並べるため、広い画面ではこのページだけ共通の幅より広げる（中央ぞろえのまま）
  return (
    <div className="flex flex-col gap-4 lg:mx-[calc((100%-56rem)/2)]">
      <h1 className="text-2xl font-bold">推移</h1>
      <Suspense fallback={<p>読み込み中...</p>}>
        <Trends searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
