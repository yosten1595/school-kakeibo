import { Suspense } from "react";
import { connection } from "next/server";
import { CategoriesView } from "@/components/CategoriesView";
import { listCategoriesWithUsage } from "@/lib/db/categories";

async function CategoriesData() {
  await connection();
  const categories = await listCategoriesWithUsage();
  return <CategoriesView categories={categories} />;
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<p>読み込み中...</p>}>
      <CategoriesData />
    </Suspense>
  );
}
