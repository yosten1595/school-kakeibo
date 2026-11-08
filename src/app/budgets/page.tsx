import { Suspense } from "react";
import { connection } from "next/server";
import { BudgetForm } from "@/components/BudgetForm";
import { MonthNav } from "@/components/MonthNav";
import { budgetFieldName } from "@/lib/budget";
import { LoadErrorView } from "@/components/LoadErrorView";
import { listBudgets } from "@/lib/db/budgets";
import { load } from "@/lib/db/load";
import { getExpenseByCategory } from "@/lib/db/transactions";
import { parseMonth, shiftMonth } from "@/lib/month";
import type { Budget } from "@/lib/types";

/** 入力欄の name → 予算額 */
function toAmounts(budgets: Budget[]): Record<string, number> {
  return Object.fromEntries(budgets.map((b) => [budgetFieldName(b.categoryId), b.amount]));
}

async function Budgets({ searchParams }: { searchParams: PageProps<"/budgets">["searchParams"] }) {
  await connection(); // 月の指定がないときは「今日」から今月を決めるため、毎回のリクエストで処理する
  const month = parseMonth((await searchParams).month);
  const previousMonth = shiftMonth(month, -1);
  // getExpenseByCategory は全支出カテゴリを登録順で返す（支出がなければ 0）
  const result = await load(() =>
    Promise.all([listBudgets(month), listBudgets(previousMonth), getExpenseByCategory(month)]),
  );
  if (!result.ok) return <LoadErrorView error={result.error} />;
  const [budgets, previousBudgets, expenses] = result.data;

  return (
    <div className="flex flex-col gap-5">
      <MonthNav month={month} basePath="/budgets" />
      <BudgetForm
        key={month}
        month={month}
        previousMonth={previousMonth}
        categories={expenses.map((e) => ({ id: e.categoryId, name: e.categoryName, spent: e.total }))}
        totalSpent={expenses.reduce((sum, e) => sum + e.total, 0)}
        amounts={toAmounts(budgets)}
        previousAmounts={toAmounts(previousBudgets)}
      />
    </div>
  );
}

export default function BudgetsPage(props: PageProps<"/budgets">) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">予算</h1>
      <Suspense fallback={<p>読み込み中...</p>}>
        <Budgets searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
