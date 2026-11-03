import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-bold">ページが見つかりません</h1>
      <Link href="/transactions" className="text-blue-700 underline dark:text-blue-400">
        収支一覧へ戻る
      </Link>
    </div>
  );
}
