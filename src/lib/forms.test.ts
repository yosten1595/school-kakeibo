import { describe, expect, it } from "vitest";
import { parseCategoryForm, MAX_NAME_LENGTH } from "./category-form";
import { parseTransactionForm } from "./transaction-form";

function form(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

const valid = { date: "2026-11-08", type: "expense", amount: "1234", categoryId: "1", memo: " 昼食 " };

describe("parseTransactionForm（収支の入力の検証）", () => {
  it("正しい入力は、前後の空白を除いて受け付ける", () => {
    expect(parseTransactionForm(form(valid))).toEqual({
      ok: true,
      input: { date: "2026-11-08", type: "expense", amount: 1234, categoryId: 1, memo: "昼食" },
    });
  });

  it("メモが空なら null", () => {
    const result = parseTransactionForm(form({ ...valid, memo: "" }));
    expect(result.ok && result.input.memo).toBeNull();
  });

  it.each([
    ["date", "", "date"],
    ["date", "2026-02-30", "date"], // 存在しない日付
    ["date", "2026/11/08", "date"],
    ["type", "other", "type"],
    ["amount", "", "amount"],
    ["amount", "0", "amount"],
    ["amount", "1.5", "amount"],
    ["amount", "-100", "amount"],
    ["amount", "100000000", "amount"],
    ["categoryId", "", "categoryId"],
    ["categoryId", "abc", "categoryId"],
    ["memo", "あ".repeat(256), "memo"],
  ])("%s に「%s」はエラー", (field, value, errorField) => {
    const result = parseTransactionForm(form({ ...valid, [field]: value }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.state.errors?.[errorField as "date"]).toBeTruthy();
      expect(result.state.values?.[field as "date"]).toBe(value.trim()); // 入力値は残す
    }
  });

  it("金額は 99,999,999 円まで、メモは 255 文字まで受け付ける", () => {
    expect(parseTransactionForm(form({ ...valid, amount: "99999999", memo: "あ".repeat(255) })).ok).toBe(true);
  });
});

describe("parseCategoryForm（カテゴリの入力の検証）", () => {
  it("正しい入力", () => {
    expect(parseCategoryForm(form({ name: " 外食 ", type: "expense" }), true)).toEqual({
      ok: true,
      name: "外食",
      type: "expense",
    });
  });

  it("全角スペースだけの名前は空として扱う", () => {
    const result = parseCategoryForm(form({ name: "　　", type: "expense" }), true);
    expect(result.ok).toBe(false);
  });

  it(`名前は ${MAX_NAME_LENGTH} 文字まで`, () => {
    expect(parseCategoryForm(form({ name: "あ".repeat(MAX_NAME_LENGTH), type: "income" }), true).ok).toBe(true);
    expect(parseCategoryForm(form({ name: "あ".repeat(MAX_NAME_LENGTH + 1), type: "income" }), true).ok).toBe(false);
  });

  it("追加のときは種別が必要。編集（名前だけ変更）のときは見ない", () => {
    expect(parseCategoryForm(form({ name: "外食", type: "other" }), true).ok).toBe(false);
    expect(parseCategoryForm(form({ name: "外食" }), false).ok).toBe(true);
  });
});
