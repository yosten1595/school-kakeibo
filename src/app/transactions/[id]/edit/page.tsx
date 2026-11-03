import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TransactionForm } from "@/components/TransactionForm";
import { listCategories } from "@/lib/db/categories";
import { getTransaction } from "@/lib/db/transactions";
import { updateTransactionAction } from "../../actions";

async function EditForm({
  params,
}: {
  params: PageProps<"/transactions/[id]/edit">["params"];
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) notFound();

  const [transaction, categories] = await Promise.all([getTransaction(id), listCategories()]);
  if (!transaction) notFound();

  return (
    <TransactionForm
      action={updateTransactionAction.bind(null, id)}
      categories={categories}
      initial={{
        date: transaction.date,
        type: transaction.type,
        amount: String(transaction.amount),
        categoryId: String(transaction.categoryId),
        memo: transaction.memo ?? "",
      }}
      submitLabel="更新する"
      cancelHref={`/transactions?month=${transaction.date.slice(0, 7)}`}
    />
  );
}

export default function EditTransactionPage(props: PageProps<"/transactions/[id]/edit">) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">収支の編集</h1>
      <Suspense fallback={<p>読み込み中...</p>}>
        <EditForm params={props.params} />
      </Suspense>
    </div>
  );
}
