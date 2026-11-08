"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

/** 「削除」ボタン。押すと確認ダイアログを出し、「削除する」で action を実行する */
export function DeleteButton({ action, label }: { action: () => Promise<void>; label: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded px-2 py-1 text-sm text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
      >
        削除
      </button>
      {open && (
        <ConfirmDialog
          message={`「${label}」を削除します。よろしいですか？`}
          pending={pending}
          onConfirm={() =>
            startTransition(async () => {
              await action();
              setOpen(false);
            })
          }
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}
