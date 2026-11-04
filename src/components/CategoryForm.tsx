"use client";

import { useState, useTransition } from "react";
import { MAX_NAME_LENGTH } from "@/lib/category-form";
import type { CategoryFormState, TransactionType } from "@/lib/types";

type Props = {
  action: (formData: FormData) => Promise<CategoryFormState>;
  /** 追加のときは種別を選べる。編集のときは種別を表示するだけ（変更不可） */
  mode: "create" | "edit";
  initialName: string;
  initialType: TransactionType;
  submitLabel: string;
  onSaved: () => void;
  onCancel: () => void;
};

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-400">
      {message}
    </p>
  ) : null;
}

export function CategoryForm({
  action,
  mode,
  initialName,
  initialType,
  submitLabel,
  onSaved,
  onCancel,
}: Props) {
  const [errors, setErrors] = useState<NonNullable<CategoryFormState["errors"]>>({});
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<TransactionType>(initialType);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await action(formData);
          if (result.saved) onSaved();
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
        {mode === "create" ? (
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
                  onChange={() => setType(t)}
                />
                {t === "expense" ? "支出" : "収入"}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-zinc-700 dark:text-zinc-300">
            {initialType === "expense" ? "支出" : "収入"}
            <span className="ml-2 text-sm text-zinc-500">（種別は変更できません）</span>
          </p>
        )}
        <FieldError message={errors.type} />
      </fieldset>

      <div>
        <label htmlFor="name" className="mb-1 block font-medium">カテゴリ名</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={MAX_NAME_LENGTH}
          defaultValue={initialName}
          className={inputClass}
        />
        <FieldError message={errors.name} />
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
