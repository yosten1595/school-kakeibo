// 月は "YYYY-MM" の文字列で扱う。日付は "YYYY-MM-DD"。日本時間（Asia/Tokyo）を基準にする。

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function today(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

export function currentMonth(): string {
  return today().slice(0, 7);
}

export function parseMonth(value: string | string[] | undefined): string {
  return typeof value === "string" && MONTH_RE.test(value) ? value : currentMonth();
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** [開始日, 翌月1日) の範囲を返す */
export function monthRange(month: string): { start: string; end: string } {
  return { start: `${month}-01`, end: `${shiftMonth(month, 1)}-01` };
}

export function formatMonth(month: string): string {
  const [y, m] = month.split("-");
  return `${y}年${Number(m)}月`;
}

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

/** 符号つきの金額（+ / -）。0 は符号なし */
export function formatSignedYen(amount: number): string {
  if (amount === 0) return formatYen(0);
  return `${amount > 0 ? "+" : "-"}${formatYen(Math.abs(amount))}`;
}
