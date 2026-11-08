import { Suspense } from "react";
import { connection } from "next/server";
import { TransactionsView } from "@/components/TransactionsView";
import { LoadErrorView } from "@/components/LoadErrorView";
import { listCategories } from "@/lib/db/categories";
import { load } from "@/lib/db/load";
import { listTransactionsByMonth } from "@/lib/db/transactions";
import { parseMonth, today } from "@/lib/month";
import { parseTransactionFilter } from "@/lib/transaction-filter";

async function TransactionsData({
  searchParams,
}: {
  searchParams: PageProps<"/transactions">["searchParams"];
}) {
  await connection(); // 月の指定がないときは「今日」から今月を決めるため、毎回のリクエストで処理する
  const params = await searchParams;
  const month = parseMonth(params.month);
  const filter = parseTransactionFilter(params);
  const result = await load(() => Promise.all([listTransactionsByMonth(month, filter), listCategories()]));
  if (!result.ok) return <LoadErrorView error={result.error} />;
  const [transactions, categories] = result.data;

  return (
    <TransactionsView
      month={month}
      today={today()}
      transactions={transactions}
      categories={categories}
      filter={filter}
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
