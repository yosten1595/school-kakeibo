import { describe, expect, it } from "vitest";
import { HEAT_LEVELS, heatLevel } from "./heat";
import { describeLoadError } from "./load-error";

describe("heatLevel（表のマスの濃さ）", () => {
  it("最大の金額は一番濃い", () => {
    expect(heatLevel(65000, 65000)).toBe(HEAT_LEVELS);
  });

  it("小さな金額でも最低 1 段階", () => {
    expect(heatLevel(1, 65000)).toBe(1);
  });

  it("平方根で段階を分ける（最大の 1/4 は 5 段階中 3）", () => {
    expect(heatLevel(25, 100)).toBe(3);
    expect(heatLevel(4, 100)).toBe(1);
  });
});

describe("describeLoadError（エラーの分類）", () => {
  it("MySQL が止まっているときは「接続できない」", () => {
    const e = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:3306"), { code: "ECONNREFUSED" });
    expect(describeLoadError(e)).toEqual({
      kind: "connection",
      code: "ECONNREFUSED",
      detail: "connect ECONNREFUSED 127.0.0.1:3306",
    });
  });

  it("接続先が複数のときの AggregateError（message が空）は、中のエラーの内容を出す", () => {
    const e = Object.assign(
      new AggregateError([new Error("connect ECONNREFUSED ::1:3306"), new Error("connect ECONNREFUSED 127.0.0.1:3306")], ""),
      { code: "ECONNREFUSED" },
    );
    const info = describeLoadError(e);
    expect(info.kind).toBe("connection");
    expect(info.detail).toBe("connect ECONNREFUSED ::1:3306 / connect ECONNREFUSED 127.0.0.1:3306");
  });

  it("パスワードの誤りも「接続できない」", () => {
    expect(describeLoadError({ code: "ER_ACCESS_DENIED_ERROR", sqlMessage: "Access denied" }).kind).toBe("connection");
  });

  it("SQL のエラーは MySQL のメッセージを出す", () => {
    const e = Object.assign(new Error("Table 'kakeibo.budgets' doesn't exist"), {
      code: "ER_NO_SUCH_TABLE",
      sqlMessage: "Table 'kakeibo.budgets' doesn't exist",
    });
    expect(describeLoadError(e)).toEqual({
      kind: "sql",
      code: "ER_NO_SUCH_TABLE",
      detail: "Table 'kakeibo.budgets' doesn't exist",
    });
  });

  it("それ以外は「予期しないエラー」", () => {
    expect(describeLoadError(new Error("boom"))).toEqual({ kind: "unknown", code: null, detail: "boom" });
    expect(describeLoadError("文字列のエラー")).toEqual({ kind: "unknown", code: null, detail: "文字列のエラー" });
    expect(describeLoadError(null).kind).toBe("unknown");
  });
});
