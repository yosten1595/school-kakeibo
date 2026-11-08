import { unstable_rethrow } from "next/navigation";
import { describeLoadError, type LoadErrorInfo } from "@/lib/load-error";

export type Loaded<T> = { ok: true; data: T } | { ok: false; error: LoadErrorInfo };

/**
 * 画面のデータを読み込む。失敗したら、エラー画面に原因を表示できるよう分類して返す。
 * （Next.js は本番環境ではエラーの中身をエラー画面に渡さないため、サーバー側で受け止める）
 */
export async function load<T>(fn: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    unstable_rethrow(e); // Next.js が内部で使うエラーは受け止めずに投げ直す
    console.error(e);
    return { ok: false, error: describeLoadError(e) };
  }
}
