import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { YearlyCategoryTable } from "@/components/YearlyCategoryTable";
import { YearlyTrendChart } from "@/components/YearlyTrendChart";
import { getYearlyOverview } from "@/lib/db/transactions";
import { parseYear, shiftYear } from "@/lib/month";

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

async function Trends({ searchParams }: { searchParams: PageProps<"/trends">["searchParams"] }) {
  await connection(); // 年の指定がないときは「今日」から今年を決めるため、毎回のリクエストで処理する
  const year = parseYear((await searchParams).year);
  const { months, categories } = await getYearlyOverview(year);
  const hasData = months.some((m) => m.income > 0 || m.expense > 0);

  return (
    <div className="flex flex-col gap-5">
      <YearNav year={year} />
      {hasData ? (
        <>
          <section>
            <h2 className="mb-2 font-semibold">月別の収支</h2>
            <YearlyTrendChart months={months} />
          </section>
          <section>
            <h2 className="mb-2 font-semibold">カテゴリ別・月別の支出</h2>
            <YearlyCategoryTable categories={categories} months={months} />
          </section>
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          この年の収支はまだありません
        </p>
      )}
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
