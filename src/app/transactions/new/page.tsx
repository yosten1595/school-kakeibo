import { Suspense } from "react";
import { connection } from "next/server";
import { TransactionForm } from "@/components/TransactionForm";
import { listCategories } from "@/lib/db/categories";
import { today } from "@/lib/month";
import { createTransactionAction } from "../actions";

async function NewForm() {
  await connection(); // 今日の日付を毎回のリクエストで決める
  const categories = await listCategories();
  return (
    <TransactionForm
      action={createTransactionAction}
      categories={categories}
      initial={{ date: today(), type: "expense", amount: "", categoryId: "", memo: "" }}
      submitLabel="登録する"
      cancelHref="/transactions"
    />
  );
}

export default function NewTransactionPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">収支の登録</h1>
      <Suspense fallback={<p>読み込み中...</p>}>
        <NewForm />
      </Suspense>
    </div>
  );
}
