"use client";

import { useState, useTransition } from "react";
import type { Category, TransactionFormState } from "@/lib/types";

type Props = {
  action: (formData: FormData) => Promise<TransactionFormState>;
  categories: Category[];
  initial: NonNullable<TransactionFormState["values"]>;
  submitLabel: string;
  onSaved: (month: string) => void;
  onCancel: () => void;
};

const inputClass =
  "h-[42px] w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-400">
      {message}
    </p>
  ) : null;
}

export function TransactionForm({
  action,
  categories,
  initial,
  submitLabel,
  onSaved,
  onCancel,
}: Props) {
  const [errors, setErrors] = useState<NonNullable<TransactionFormState["errors"]>>({});
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState(initial.type === "income" ? "income" : "expense");
  const [categoryId, setCategoryId] = useState(initial.categoryId);

  const options = categories.filter((c) => c.type === type);

  function changeType(next: "income" | "expense") {
    setType(next);
    // 種別を変えたら、合わなくなったカテゴリの選択を外す
    if (!categories.some((c) => String(c.id) === categoryId && c.type === next)) {
      setCategoryId("");
    }
  }

  return (
    <form
      // 入力欄は React の管理に任せ、送信後に入力が消えないよう onSubmit で Server Action を呼ぶ
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await action(formData);
          if (result.savedMonth) onSaved(result.savedMonth);
          else setErrors(result.errors ?? {});
        });
      }}
      className="flex flex-col gap-5"
    >
      {errors.form && (
        <p
          role="alert"
          className="rounded-md bg-red-50 p-3 text-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {errors.form}
        </p>
      )}

      <fieldset>
        <legend className="mb-1 font-medium">種別</legend>
        <div className="flex gap-3">
          {(["expense", "income"] as const).map((t) => (
            <label
              key={t}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 py-2 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 dark:border-zinc-700 dark:has-[:checked]:bg-blue-950"
            >
              <input
                type="radio"
                name="type"
                value={t}
                checked={type === t}
                onChange={() => changeType(t)}
              />
              {t === "expense" ? "支出" : "収入"}
            </label>
          ))}
        </div>
        <FieldError message={errors.type} />
      </fieldset>

      <div>
        <label htmlFor="date" className="mb-1 block font-medium">日付</label>
        <input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={initial.date}
          className={inputClass}
        />
        <FieldError message={errors.date} />
      </div>

      <div>
        <label htmlFor="amount" className="mb-1 block font-medium">金額（円）</label>
        <input
          id="amount"
          name="amount"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          required
          defaultValue={initial.amount}
          className={inputClass}
        />
        <FieldError message={errors.amount} />
      </div>

      <div>
        <label htmlFor="categoryId" className="mb-1 block font-medium">カテゴリ</label>
        <select
          id="categoryId"
          name="categoryId"
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={`${inputClass} select-field`}
        >
          <option value="">選択してください</option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <FieldError message={errors.categoryId} />
      </div>

      <div>
        <label htmlFor="memo" className="mb-1 block font-medium">メモ（任意）</label>
        <input
          id="memo"
          name="memo"
          type="text"
          maxLength={255}
          defaultValue={initial.memo}
          className={inputClass}
        />
        <FieldError message={errors.memo} />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "保存中..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-zinc-300 px-4 py-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
