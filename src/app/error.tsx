"use client";

/** 画面の表示中にエラーが起きたとき。原因は DB の停止とは限らないので、言い切らない */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-bold">データを読み込めませんでした</h1>
      <p className="text-zinc-700 dark:text-zinc-300">
        画面の表示中にエラーが発生しました。もう一度お試しください。
      </p>
      <p className="text-zinc-700 dark:text-zinc-300">
        続けて起きる場合は、データベース（MySQL）が止まっている可能性があります。Docker Desktop を起動し、
        <code className="mx-1 rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
          docker compose up -d
        </code>
        を実行してから、もう一度お試しください。
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        もう一度試す
      </button>
    </div>
  );
}
