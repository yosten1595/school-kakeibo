import { describe, expect, it } from "vitest";
import {
  filterQuery,
  isFiltered,
  MAX_KEYWORD_LENGTH,
  NO_FILTER,
  parseTransactionFilter,
  toLikePattern,
  transactionsHref,
} from "./transaction-filter";

describe("parseTransactionFilter", () => {
  it("正しい値はそのまま条件にする（キーワードは前後の空白を除く）", () => {
    expect(parseTransactionFilter({ q: "  コンビニ ", type: "income", category: "3" })).toEqual({
      keyword: "コンビニ",
      type: "income",
      categoryId: 3,
    });
  });

  it("指定がなければ条件なし", () => {
    expect(parseTransactionFilter({})).toEqual(NO_FILTER);
  });

  it.each(["foo", "INCOME", ""])("種別 %s は指定なし", (type) => {
    expect(parseTransactionFilter({ type }).type).toBeNull();
  });

  it.each(["0", "-1", "abc", "1.5", "12345678901", ""])("カテゴリ %s は指定なし", (category) => {
    expect(parseTransactionFilter({ category }).categoryId).toBeNull();
  });

  it("同じ名前が複数あるときは指定なし", () => {
    expect(parseTransactionFilter({ q: ["a", "b"], category: ["1", "2"] })).toEqual(NO_FILTER);
  });

  it(`キーワードは ${MAX_KEYWORD_LENGTH} 文字まで`, () => {
    expect(parseTransactionFilter({ q: "x".repeat(150) }).keyword).toHaveLength(MAX_KEYWORD_LENGTH);
  });
});

describe("isFiltered / filterQuery / transactionsHref", () => {
  const filter = { keyword: "昼食", type: "expense" as const, categoryId: 1 };

  it("条件があるかどうか", () => {
    expect(isFiltered(NO_FILTER)).toBe(false);
    expect(isFiltered({ ...NO_FILTER, keyword: "a" })).toBe(true);
    expect(isFiltered({ ...NO_FILTER, categoryId: 2 })).toBe(true);
  });

  it("URL には指定がある条件だけを付ける", () => {
    expect(filterQuery(NO_FILTER)).toEqual({});
    expect(filterQuery(filter)).toEqual({ q: "昼食", type: "expense", category: "1" });
  });

  it("収支一覧の URL", () => {
    expect(transactionsHref("2026-10")).toBe("/transactions?month=2026-10");
    expect(transactionsHref("2026-10", filter)).toBe(
      "/transactions?month=2026-10&q=%E6%98%BC%E9%A3%9F&type=expense&category=1",
    );
  });
});

describe("toLikePattern（LIKE の特殊文字のエスケープ）", () => {
  it("「含む」のパターンにする", () => {
    expect(toLikePattern("コンビニ")).toBe("%コンビニ%");
  });

  it("% と _ と \\ は、ただの文字として検索する", () => {
    expect(toLikePattern("%")).toBe("%\\%%");
    expect(toLikePattern("_")).toBe("%\\_%");
    expect(toLikePattern("50%_off\\")).toBe("%50\\%\\_off\\\\%");
  });

  it("SQL のような文字列もそのまま値として扱う（プレースホルダで渡す前提）", () => {
    expect(toLikePattern("' OR 1=1 --")).toBe("%' OR 1=1 --%");
  });
});
