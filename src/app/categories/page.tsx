import { Suspense } from "react";
import { connection } from "next/server";
import { CategoriesView } from "@/components/CategoriesView";
import { LoadErrorView } from "@/components/LoadErrorView";
import { listCategoriesWithUsage } from "@/lib/db/categories";
import { load } from "@/lib/db/load";

async function CategoriesData() {
  await connection();
  const result = await load(() => listCategoriesWithUsage());
  if (!result.ok) return <LoadErrorView error={result.error} />;
  return <CategoriesView categories={result.data} />;
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<p>読み込み中...</p>}>
      <CategoriesData />
    </Suspense>
  );
}
