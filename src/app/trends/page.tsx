import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { TrendChart } from "@/components/TrendChart";
import { WeeklyTable } from "@/components/WeeklyTable";
import { YearlyCategoryTable } from "@/components/YearlyCategoryTable";
import { getWeeklyTotals, getYearlyOverview } from "@/lib/db/transactions";
import { parseYear, shiftYear, today } from "@/lib/month";
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

function YearNav({ year }: { year: string }) {
  const linkClass = "rounded px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800";
  return (
    <div className="flex items-center justify-between">
      <Link href={`/trends?year=${shiftYear(year, -1)}`} className={linkClass}>
        ← 前年
      </Link>
      <h2 className="text-lg font-semibold">{year}年</h2>
      <Link href={`/trends?year=${shiftYear(year, 1)}`} className={linkClass}>
        翌年 →
      </Link>
    </div>
  );
}

async function YearlyView({ year }: { year: string }) {
  const { months, categories } = await getYearlyOverview(year);
  const hasData = months.some((m) => m.income > 0 || m.expense > 0);
  return (
    <>
      <YearNav year={year} />
      {hasData ? (
        <>
          <section>
            <h2 className="mb-2 font-semibold">月別の収支</h2>
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
  const weeks = await getWeeklyTotals(date, WEEK_COUNT);
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
        <>
          <section>
            <h2 className="mb-2 font-semibold">週別の収支</h2>
            <TrendChart
              points={weeks.map((w) => ({
                label: formatMonthDay(w.weekStart),
                title: `${formatWeekRange(w.weekStart)} の週`,
                income: w.income,
                expense: w.expense,
              }))}
              ariaLabel={`直近${WEEK_COUNT}週の収入・支出・差額のグラフ。金額は下の表を参照`}
              testId="weekly-chart"
              showAllTicks={false}
            />
          </section>
          <section>
            <h2 className="mb-2 font-semibold">週ごとの金額</h2>
            <WeeklyTable weeks={weeks} currentWeek={weekStart(date)} />
          </section>
        </>
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
      {view === "weekly" ? <WeeklyView /> : <YearlyView year={year} />}
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
