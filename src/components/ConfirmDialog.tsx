"use client";

import { Modal } from "@/components/Modal";

/**
 * 削除などの確認ダイアログ（ブラウザ標準の window.confirm の代わり）。
 * 「キャンセル」・Esc キー・背景のクリックでは何もしない。誤って実行しないよう、最初は「キャンセル」にフォーカスを置く。
 */
export function ConfirmDialog({
  title = "削除の確認",
  message,
  confirmLabel = "削除する",
  pending = false,
  onConfirm,
  onCancel,
}: {
  title?: string;
  message: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={() => !pending && onCancel()}>
      <p data-testid="confirm-message" className="mb-5">
        {message}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="flex-1 rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? "削除中..." : confirmLabel}
        </button>
        <button
          type="button"
          data-autofocus
          onClick={onCancel}
          disabled={pending}
          className="rounded-md border border-zinc-300 px-4 py-2 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          キャンセル
        </button>
      </div>
    </Modal>
  );
}
