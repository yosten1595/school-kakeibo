import { Suspense } from "react";
import { connection } from "next/server";
import { TransactionsView } from "@/components/TransactionsView";
import { listCategories } from "@/lib/db/categories";
import { listTransactionsByMonth } from "@/lib/db/transactions";
import { parseMonth, today } from "@/lib/month";

async function TransactionsData({
  searchParams,
}: {
  searchParams: PageProps<"/transactions">["searchParams"];
}) {
  await connection(); // 月の指定がないときは「今日」から今月を決めるため、毎回のリクエストで処理する
  const month = parseMonth((await searchParams).month);
  const [transactions, categories] = await Promise.all([
    listTransactionsByMonth(month),
    listCategories(),
  ]);

  return (
    <TransactionsView
      month={month}
      today={today()}
      transactions={transactions}
      categories={categories}
    />
  );
}

export default function TransactionsPage(props: PageProps<"/transactions">) {
  return (
    <Suspense fallback={<p>読み込み中...</p>}>
      <TransactionsData searchParams={props.searchParams} />
    </Suspense>
  );
}
