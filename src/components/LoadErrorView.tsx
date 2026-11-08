"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { LoadErrorInfo, LoadErrorKind } from "@/lib/load-error";

const EXPLANATION: Record<LoadErrorKind, { label: string; hint: React.ReactNode }> = {
  connection: {
    label: "データベース（MySQL）に接続できません",
    hint: (
      <>
        Docker Desktop を起動し、
        <code className="mx-1 rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">docker compose up -d</code>
        を実行してから、もう一度読み込んでください。
      </>
    ),
  },
  sql: {
    label: "SQL の実行でエラーが発生しました",
    hint: "アプリの不具合の可能性があります。この画面の URL と、上の内容を控えておいてください。",
  },
  unknown: {
    label: "予期しないエラーが発生しました",
    hint: "もう一度読み込んでも直らない場合は、この画面の URL と、上の内容を控えておいてください。",
  },
};

/**
 * データを読み込めなかったときの表示。上に、誰が見てもエラーだと分かる表示を出し、
 * 下に詳しい原因（種類・内容・対処）を出す。
 */
export function LoadErrorView({ error, reset }: { error: LoadErrorInfo; reset?: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { label, hint } = EXPLANATION[error.kind];

  return (
    <div data-testid="load-error" data-kind={error.kind} className="flex flex-col gap-4">
      <div
        role="alert"
        className="rounded-lg border-2 border-red-600 bg-red-50 p-4 dark:border-red-500 dark:bg-red-950/50"
      >
        <p className="text-lg font-bold text-red-800 dark:text-red-200">⚠ エラーが発生しました</p>
        <p className="mt-1 text-red-800 dark:text-red-200">データを読み込めなかったため、この画面を表示できません。</p>
      </div>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-2 font-semibold">詳しい原因</h2>
        <dl className="grid grid-cols-[4rem_1fr] gap-x-3 gap-y-2 text-sm">
          <dt className="text-zinc-600 dark:text-zinc-400">種類</dt>
          <dd className="font-medium">{label}</dd>
          <dt className="text-zinc-600 dark:text-zinc-400">内容</dt>
          <dd className="break-all font-mono text-xs">
            {error.code && <span className="mr-1 font-semibold">{error.code}:</span>}
            {error.detail}
          </dd>
          <dt className="text-zinc-600 dark:text-zinc-400">対処</dt>
          <dd>{hint}</dd>
        </dl>
      </section>

      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => {
            router.refresh();
            reset?.();
          })
        }
        className="self-start rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "読み込み中..." : "もう一度読み込む"}
      </button>
    </div>
  );
}
