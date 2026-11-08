// 画面のデータを読み込めなかったときの、エラーの分類と表示用の説明。

export type LoadErrorKind = "connection" | "sql" | "unknown";

/** 画面に表示するエラーの内容（サーバーからブラウザへ渡すので、ただのデータにする） */
export interface LoadErrorInfo {
  kind: LoadErrorKind;
  code: string | null; // 例: ECONNREFUSED、ER_NO_SUCH_TABLE
  detail: string; // エラーの中身（MySQL のメッセージなど）
}

/** DB に接続できないときのエラーコード（mysql2 / Node.js） */
const CONNECTION_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENOTFOUND",
  "PROTOCOL_CONNECTION_LOST",
  "ER_ACCESS_DENIED_ERROR",
  "ER_BAD_DB_ERROR",
]);

interface ErrorLike {
  code?: unknown;
  sqlMessage?: unknown;
  message?: unknown;
  errors?: unknown;
}

/** エラーを「接続できない」「SQL のエラー」「それ以外」に分類する */
export function describeLoadError(error: unknown): LoadErrorInfo {
  const e = (typeof error === "object" && error !== null ? error : {}) as ErrorLike;
  const code = typeof e.code === "string" ? e.code : null;
  // 接続先が複数（IPv4 / IPv6）あると AggregateError になり、message が空で中身が errors に入る
  const nested = Array.isArray(e.errors)
    ? e.errors.map((x) => (x as ErrorLike)?.message).filter((m): m is string => typeof m === "string" && m !== "")
    : [];
  const detail =
    (typeof e.sqlMessage === "string" && e.sqlMessage) ||
    (typeof e.message === "string" && e.message) ||
    nested.join(" / ") ||
    String(error);

  if (code && CONNECTION_CODES.has(code)) return { kind: "connection", code, detail };
  if (typeof e.sqlMessage === "string" || code?.startsWith("ER_")) return { kind: "sql", code, detail };
  return { kind: "unknown", code, detail };
}
