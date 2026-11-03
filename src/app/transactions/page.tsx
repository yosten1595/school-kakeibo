import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { listTransactionsByMonth } from "@/lib/db/transactions";
import { formatMonth, formatYen, parseMonth, shiftMonth } from "@/lib/month";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteTransactionAction } from "./actions";

async function TransactionList({
  searchParams,
}: {
  searchParams: PageProps<"/transactions">["searchParams"];
}) {
  await connection(); // 月の指定がないときは「今日」から今月を決めるため、毎回のリクエストで処理する
  const month = parseMonth((await searchParams).month);
  const transactions = await listTransactionsByMonth(month);

  return (
    <>
      <div className="flex items-center justify-between">
        <Link
          href={`/transactions?month=${shiftMonth(month, -1)}`}
          className="rounded px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          ← 前月
        </Link>
        <h2 className="text-lg font-semibold">{formatMonth(month)}</h2>
        <Link
          href={`/transactions?month=${shiftMonth(month, 1)}`}
          className="rounded px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          翌月 →
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          この月の収支はまだありません
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {transactions.map((t) => (
            <li key={t.id} className="flex items-center gap-3 p-3">
              <div className="w-14 shrink-0 text-sm text-zinc-600 dark:text-zinc-400">
                {t.date.slice(5).replace("-", "/")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{t.categoryName}</div>
                {t.memo && (
                  <div className="truncate text-sm text-zinc-600 dark:text-zinc-400">{t.memo}</div>
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
              <div className="flex shrink-0 items-center">
                <Link
                  href={`/transactions/${t.id}/edit`}
                  className="rounded px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  編集
                </Link>
                <DeleteButton
                  action={deleteTransactionAction.bind(null, t.id)}
                  label={`${t.date} ${t.categoryName} ${formatYen(t.amount)}`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function TransactionsPage(props: PageProps<"/transactions">) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">収支一覧</h1>
        <Link
          href="/transactions/new"
          className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          ＋ 登録
        </Link>
      </div>
      <Suspense fallback={<p>読み込み中...</p>}>
        <TransactionList searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
