"use client";

import { LoadErrorView } from "@/components/LoadErrorView";

/**
 * 各画面で受け止めきれなかったエラーの表示（DB の読み込み失敗は、各画面の LoadErrorView で原因つきで表示する）。
 * 本番環境ではサーバーのエラーの中身は渡されないため、サーバーのログと照らし合わせる番号（digest）を出す。
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <LoadErrorView
      error={{
        kind: "unknown",
        code: error.digest ? `digest ${error.digest}` : null,
        detail: error.message || "内容を取得できませんでした",
      }}
      reset={reset}
    />
  );
}
