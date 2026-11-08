import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatMonth,
  formatSignedYen,
  formatYen,
  isMonth,
  isYear,
  monthRange,
  parseMonth,
  parseYear,
  shiftMonth,
  shiftYear,
  today,
  yearBounds,
  yearRange,
} from "./month";

/** 「今」を日本時間で指定する */
function setNow(jst: string) {
  vi.setSystemTime(new Date(`${jst}+09:00`));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  setNow("2026-11-08T12:00:00");
});
afterEach(() => {
  vi.useRealTimers();
});

describe("today（日本時間）", () => {
  it("日本時間の日付を返す", () => {
    expect(today()).toBe("2026-11-08");
  });

  it("UTC ではまだ前日でも、日本時間の日付になる", () => {
    setNow("2027-01-01T00:30:00"); // UTC では 2026-12-31 15:30
    expect(today()).toBe("2027-01-01");
  });
});

describe("yearBounds（今年の前後 10 年。1980〜2050 年の外には出ない）", () => {
  it("2026 年なら 2016〜2036 年", () => {
    expect(yearBounds()).toEqual({ min: 2016, max: 2036 });
  });

  it("1985 年なら下限は 1980 年", () => {
    setNow("1985-06-01T12:00:00");
    expect(yearBounds()).toEqual({ min: 1980, max: 1995 });
  });

  it("2045 年なら上限は 2050 年", () => {
    setNow("2045-06-01T12:00:00");
    expect(yearBounds()).toEqual({ min: 2035, max: 2050 });
  });
});

describe("isMonth / parseMonth", () => {
  it.each(["2016-01", "2026-11", "2036-12"])("%s は表示できる", (m) => {
    expect(isMonth(m)).toBe(true);
    expect(parseMonth(m)).toBe(m);
  });

  it.each(["2015-12", "2037-01", "9999-12", "0000-01", "2026-13", "2026-00", "2026-1", "abc", ""])(
    "%s は今月として扱う",
    (m) => {
      expect(isMonth(m)).toBe(false);
      expect(parseMonth(m)).toBe("2026-11");
    },
  );

  it("指定がない・複数指定は今月", () => {
    expect(parseMonth(undefined)).toBe("2026-11");
    expect(parseMonth(["2026-10", "2026-09"])).toBe("2026-11");
    expect(isMonth(202611)).toBe(false);
  });
});

describe("isYear / parseYear", () => {
  it.each(["2016", "2026", "2036"])("%s は表示できる", (y) => {
    expect(isYear(y)).toBe(true);
    expect(parseYear(y)).toBe(y);
  });

  it.each(["2015", "2037", "9999", "1000", "0000", "26", "abc"])("%s は今年として扱う", (y) => {
    expect(isYear(y)).toBe(false);
    expect(parseYear(y)).toBe("2026");
  });
});

describe("月・年の計算", () => {
  it("shiftMonth は年をまたぐ", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-03", -14)).toBe("2025-01");
  });

  it("shiftYear", () => {
    expect(shiftYear("2026", -1)).toBe("2025");
  });

  it("monthRange / yearRange は [開始日, 次の開始日)", () => {
    expect(monthRange("2026-12")).toEqual({ start: "2026-12-01", end: "2027-01-01" });
    expect(yearRange("2026")).toEqual({ start: "2026-01-01", end: "2027-01-01" });
  });
});

describe("表示", () => {
  it("formatMonth", () => {
    expect(formatMonth("2026-03")).toBe("2026年3月");
  });

  it("formatYen はカンマ区切り", () => {
    expect(formatYen(1234567)).toBe("¥1,234,567");
    expect(formatYen(0)).toBe("¥0");
  });

  it("formatSignedYen は符号つき。0 は符号なし", () => {
    expect(formatSignedYen(500)).toBe("+¥500");
    expect(formatSignedYen(-74540)).toBe("-¥74,540");
    expect(formatSignedYen(0)).toBe("¥0");
  });
});
