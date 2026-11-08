import { describe, expect, it } from "vitest";
import { addDays, formatMonthDay, formatWeekRange, recentWeekStarts, weekStart } from "./week";

describe("weekStart（月曜始まり）", () => {
  it.each([
    ["2026-11-02", "2026-11-02"], // 月曜日はその日
    ["2026-11-08", "2026-11-02"], // 日曜日は前の月曜日
    ["2026-11-04", "2026-11-02"],
    ["2027-01-01", "2026-12-28"], // 年をまたぐ週（金曜日）
    ["2027-01-03", "2026-12-28"], // 年をまたぐ週（日曜日）
    ["2027-01-04", "2027-01-04"], // 次の週の月曜日
    ["2026-03-01", "2026-02-23"], // 月をまたぐ週
  ])("%s の週は %s から", (date, expected) => {
    expect(weekStart(date)).toBe(expected);
  });
});

describe("addDays", () => {
  it("月・年・うるう年をまたいで計算できる", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("recentWeekStarts", () => {
  it("今日を含む週までの直近 12 週の月曜日を、古い順に返す", () => {
    const starts = recentWeekStarts("2026-11-08", 12);
    expect(starts).toHaveLength(12);
    expect(starts[0]).toBe("2026-08-17");
    expect(starts[11]).toBe("2026-11-02");
    starts.forEach((s, i) => {
      expect(weekStart(s)).toBe(s); // すべて月曜日
      if (i > 0) expect(addDays(starts[i - 1], 7)).toBe(s); // 1 週ずつ
    });
  });
});

describe("表示", () => {
  it("月/日 と 週の期間", () => {
    expect(formatMonthDay("2026-11-02")).toBe("11/2");
    expect(formatWeekRange("2026-11-02")).toBe("11/2〜11/8");
    expect(formatWeekRange("2026-12-28")).toBe("12/28〜1/3");
  });
});
