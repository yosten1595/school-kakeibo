// 収支一覧の絞り込み条件。URL の search params（q / type / category）で受け渡す。
import type { TransactionFilter } from "@/lib/types";

export const MAX_KEYWORD_LENGTH = 100;

export const NO_FILTER: TransactionFilter = { keyword: "", type: null, categoryId: null };

type SearchParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

/** URL の値を検証して条件にする。不正な値は「条件なし」として扱う */
export function parseTransactionFilter(params: SearchParams): TransactionFilter {
  const keyword = single(params.q).trim().slice(0, MAX_KEYWORD_LENGTH);
  const type = single(params.type);
  const category = single(params.category);
  return {
    keyword,
    type: type === "income" || type === "expense" ? type : null,
    categoryId: /^[1-9]\d{0,9}$/.test(category) ? Number(category) : null,
  };
}

export function isFiltered(filter: TransactionFilter): boolean {
  return filter.keyword !== "" || filter.type !== null || filter.categoryId !== null;
}

/** リンクに付ける search params（指定がある条件だけ） */
export function filterQuery(filter: TransactionFilter): Record<string, string> {
  const query: Record<string, string> = {};
  if (filter.keyword) query.q = filter.keyword;
  if (filter.type) query.type = filter.type;
  if (filter.categoryId !== null) query.category = String(filter.categoryId);
  return query;
}

export function transactionsHref(month: string, filter: TransactionFilter = NO_FILTER): string {
  return `/transactions?${new URLSearchParams({ month, ...filterQuery(filter) })}`;
}
