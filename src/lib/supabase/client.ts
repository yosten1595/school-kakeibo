import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && key);

// 認証は使わない（1人専用アプリ）ので、セッションは保持しない。
export const supabase = createClient(
  url ?? "http://localhost",
  key ?? "missing-key",
  { auth: { persistSession: false, autoRefreshToken: false } },
);
