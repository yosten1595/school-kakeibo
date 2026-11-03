import { isSupabaseConfigured } from "./client";

export type ConnectionStatus =
  | { ok: true }
  | { ok: false; reason: string };

// Supabase の Auth ヘルスチェック用エンドポイントで疎通を確認する。
export async function checkSupabaseConnection(): Promise<ConnectionStatus> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      reason: ".env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください",
    };
  }
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`,
      {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        cache: "no-store",
      },
    );
    return res.ok
      ? { ok: true }
      : { ok: false, reason: `Supabase が HTTP ${res.status} を返しました` };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "接続に失敗しました" };
  }
}
