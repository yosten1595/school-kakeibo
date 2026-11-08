// 年は "YYYY"、月は "YYYY-MM" の文字列で扱う。日付は "YYYY-MM-DD"。日本時間（Asia/Tokyo）を基準にする。

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const YEAR_RE = /^\d{4}$/;

/** 表示できる年は「今年の前後 YEAR_SPAN 年」。ただし MIN_YEAR〜MAX_YEAR の外には出ない */
export const MIN_YEAR = 1980;
export const MAX_YEAR = 2050;
export const YEAR_SPAN = 10;

export function yearBounds(): { min: number; max: number } {
  const year = Number(today().slice(0, 4));
  return { min: Math.max(MIN_YEAR, year - YEAR_SPAN), max: Math.min(MAX_YEAR, year + YEAR_SPAN) };
}

function isYearInBounds(year: number): boolean {
  const { min, max } = yearBounds();
  return year >= min && year <= max;
}

/** "YYYY" の形で、表示できる範囲の年か */
export function isYear(value: unknown): value is string {
  return typeof value === "string" && YEAR_RE.test(value) && isYearInBounds(Number(value));
}

/** 範囲外や不正な値は今年として扱う */
export function parseYear(value: string | string[] | undefined): string {
  return isYear(value) ? value : today().slice(0, 4);
}

export function shiftYear(year: string, delta: number): string {
  return String(Number(year) + delta);
}

/** [1月1日, 翌年1月1日) の範囲を返す */
export function yearRange(year: string): { start: string; end: string } {
  return { start: `${year}-01-01`, end: `${shiftYear(year, 1)}-01-01` };
}

export function today(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

export function currentMonth(): string {
  return today().slice(0, 7);
}

/** "YYYY-MM" の形で、表示できる範囲の年の月か */
export function isMonth(value: unknown): value is string {
  return typeof value === "string" && MONTH_RE.test(value) && isYearInBounds(Number(value.slice(0, 4)));
}

/** 範囲外や不正な値は今月として扱う */
export function parseMonth(value: string | string[] | undefined): string {
  return isMonth(value) ? value : currentMonth();
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
