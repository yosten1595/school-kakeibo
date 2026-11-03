import { Suspense } from "react";
import { connection } from "next/server";
import { checkDbConnection } from "@/lib/db/check";

async function ConnectionStatus() {
  // 接続確認は毎回リクエスト時に行う
  await connection();
  const status = await checkDbConnection();

  return status.ok ? (
    <p className="text-green-700 dark:text-green-400">
      接続できました（MySQL {status.version}）
    </p>
  ) : (
    <p className="text-red-700 dark:text-red-400">
      接続できません: {status.reason}
    </p>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold">家計簿アプリ</h1>
      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-2 font-semibold">データベース接続確認</h2>
        <Suspense fallback={<p>確認中...</p>}>
          <ConnectionStatus />
        </Suspense>
      </section>
    </main>
  );
}
