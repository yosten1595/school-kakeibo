"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * ポップアップ（モーダル）。HTML 標準の <dialog> を使うので、
 * Esc キーで閉じる・背景が操作できなくなる・フォーカスが外に出ない、が自動で効く。
 * 背景（暗い部分）をクリックしても閉じる。
 */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onClose={onClose}
      onClick={(e) => {
        // <dialog> 自体がクリックされたのは、中身ではなく背景を押したとき
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl bg-white p-0 text-inherit shadow-xl backdrop:bg-black/50 dark:bg-zinc-900"
    >
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="text-xl font-bold">
            {title}
          </h2>
          <button
            type="button"
            aria-label="閉じる"
            onClick={() => ref.current?.close()}
            className="rounded px-2 py-1 text-xl leading-none text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
