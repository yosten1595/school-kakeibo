import { Suspense } from "react";
import { connection } from "next/server";
import { TransactionsView } from "@/components/TransactionsView";
import { listCategories } from "@/lib/db/categories";
import { getLastCategoryIds, listTransactionsByMonth } from "@/lib/db/transactions";
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
  const [transactions, categories, lastCategoryIds] = await Promise.all([
    listTransactionsByMonth(month, filter),
    listCategories(),
    getLastCategoryIds(),
  ]);

  return (
    <TransactionsView
      month={month}
      today={today()}
      transactions={transactions}
      categories={categories}
      filter={filter}
      lastCategoryIds={lastCategoryIds}
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
