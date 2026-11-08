// 週は月曜始まり。週を表すときは、その週の月曜日の日付（"YYYY-MM-DD"）を使う。

function toUtcDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function addDays(date: string, days: number): string {
  const d = toUtcDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** その日を含む週の月曜日 */
export function weekStart(date: string): string {
  const daysSinceMonday = (toUtcDate(date).getUTCDay() + 6) % 7; // 日曜=6, 月曜=0
  return addDays(date, -daysSinceMonday);
}

/** today を含む週までの、直近 count 週の月曜日（古い順） */
export function recentWeekStarts(today: string, count: number): string[] {
  const latest = weekStart(today);
  return Array.from({ length: count }, (_, i) => addDays(latest, (i - count + 1) * 7));
}

/** "2026-11-02" → "11/2" */
export function formatMonthDay(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${m}/${d}`;
}

/** 週の期間の表示。"11/2〜11/8" */
export function formatWeekRange(start: string): string {
  return `${formatMonthDay(start)}〜${formatMonthDay(addDays(start, 6))}`;
}
