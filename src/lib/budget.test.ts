import { describe, expect, it } from "vitest";
import {
  budgetFieldName,
  budgetStatus,
  formatAmountInput,
  formatUsage,
  parseBudgetAmount,
  positionAfterDigits,
  sumBudgets,
} from "./budget";

describe("budgetStatus（80% 以上で注意、100% 超で警告）", () => {
  it.each([
    [0, 100, "ok"],
    [79, 100, "ok"],
    [80, 100, "warning"], // ちょうど 80%
    [100, 100, "warning"], // ちょうど 100% は注意
    [101, 100, "over"], // 1 円でも超えたら超過
    [11485, 14357, "ok"], // 79.99%（小数の誤差で注意にならない）
    [11485, 14356, "warning"], // 80.002%
  ] as const)("使用額 %i / 予算 %i → %s", (used, budget, expected) => {
    expect(budgetStatus(used, budget)).toBe(expected);
  });
});

describe("formatUsage", () => {
  it("切り捨てて表示する（79.99% を 80% と表示しない）", () => {
    expect(formatUsage(79999, 100000)).toBe("79%");
    expect(formatUsage(80000, 100000)).toBe("80%");
    expect(formatUsage(0, 100)).toBe("0%");
  });

  it("超過なのに切り捨てで 100% になるときは「100%超」", () => {
    expect(formatUsage(100001, 100000)).toBe("100%超");
    expect(formatUsage(12530, 12529)).toBe("100%超");
  });

  it("100% を超えたらその値", () => {
    expect(formatUsage(105, 100)).toBe("105%");
    expect(formatUsage(100, 100)).toBe("100%");
  });
});

describe("parseBudgetAmount", () => {
  it("空欄は予算なし（null）", () => {
    expect(parseBudgetAmount("")).toEqual({ ok: true, amount: null });
    expect(parseBudgetAmount("   ")).toEqual({ ok: true, amount: null });
  });

  it("カンマ・全角数字・円記号・「円」を受け付ける", () => {
    expect(parseBudgetAmount("12,533")).toEqual({ ok: true, amount: 12533 });
    expect(parseBudgetAmount("６５，０００円")).toEqual({ ok: true, amount: 65000 });
    expect(parseBudgetAmount("¥1000")).toEqual({ ok: true, amount: 1000 });
    expect(parseBudgetAmount("99999999")).toEqual({ ok: true, amount: 99_999_999 });
  });

  it.each(["0", "abc", "1.5", "-5", "100000000"])("「%s」はエラー", (raw) => {
    const result = parseBudgetAmount(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).not.toBe("");
  });
});

describe("budgetFieldName", () => {
  it("全体は total、カテゴリ別は category-<id>", () => {
    expect(budgetFieldName(null)).toBe("total");
    expect(budgetFieldName(7)).toBe("category-7");
  });
});

describe("sumBudgets（月全体の予算 = カテゴリ別の合計）", () => {
  it("予算なし（null）を除いて合計する", () => {
    expect(sumBudgets([40000, null, 15000, 30000])).toBe(85000);
    expect(sumBudgets([1])).toBe(1);
  });

  it("すべて予算なし、またはカテゴリがないときは予算なし（null）", () => {
    expect(sumBudgets([null, null])).toBeNull();
    expect(sumBudgets([])).toBeNull();
  });
});

describe("formatAmountInput（入力中に 3 桁ごとのカンマを付ける）", () => {
  it.each([
    ["", ""],
    ["5", "5"],
    ["999", "999"],
    ["1000", "1,000"],
    ["40000", "40,000"],
    ["1234567", "1,234,567"],
    ["99999999", "99,999,999"],
  ])("「%s」→「%s」", (raw, expected) => {
    expect(formatAmountInput(raw)).toBe(expected);
  });

  it("カンマの位置がずれた入力や全角数字も付け直す", () => {
    expect(formatAmountInput("40,0000")).toBe("400,000");
    expect(formatAmountInput("4,000")).toBe("4,000");
    expect(formatAmountInput("６５０００")).toBe("65,000");
    expect(formatAmountInput("¥1000円")).toBe("1,000");
  });

  it("先頭の 0 は除く（0 だけのときは 0 を残す）", () => {
    expect(formatAmountInput("0012")).toBe("12");
    expect(formatAmountInput("0")).toBe("0");
  });

  it("数字以外が混ざっているときはそのまま返す（エラーを表示するため）", () => {
    expect(formatAmountInput("12a")).toBe("12a");
    expect(formatAmountInput("1.5")).toBe("1.5");
  });

  it("付けたカンマのある入力も、parseBudgetAmount で同じ金額になる", () => {
    expect(parseBudgetAmount(formatAmountInput("1234567"))).toEqual({ ok: true, amount: 1234567 });
  });
});

describe("positionAfterDigits（カンマを付けた後のカーソル位置）", () => {
  it("count 個目の数字の直後の位置", () => {
    expect(positionAfterDigits("40,000", 2)).toBe(2);
    expect(positionAfterDigits("40,000", 3)).toBe(4);
    expect(positionAfterDigits("1,234,567", 7)).toBe(9);
  });

  it("0 個なら先頭、数字が足りなければ末尾", () => {
    expect(positionAfterDigits("1,000", 0)).toBe(0);
    expect(positionAfterDigits("1,000", 9)).toBe(5);
  });
});
