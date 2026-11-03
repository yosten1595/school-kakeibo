"use client";

export function DeleteButton({ action, label }: { action: () => Promise<void>; label: string }) {
  return (
    <form action={action}>
      <button
        type="submit"
        onClick={(e) => {
          if (!window.confirm(`「${label}」を削除します。よろしいですか？`)) e.preventDefault();
        }}
        className="rounded px-2 py-1 text-sm text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
      >
        削除
      </button>
    </form>
  );
}
