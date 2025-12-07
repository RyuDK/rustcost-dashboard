import type { ReactNode } from "react";

export const SharedConfirmModal = ({
  open,
  title,
  message,
  okText = "OK",
  cancelText = "Cancel",
  onOk,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string | ReactNode;
  okText?: string;
  cancelText?: string;
  onOk: () => void;
  onCancel: () => void;
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="
          w-full max-w-md rounded-xl bg-white p-6 shadow-lg
          dark:bg-[var(--surface-dark)]
        "
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {message}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="
              rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-600
              hover:border-slate-400 dark:border-slate-700 dark:text-slate-300
            "
          >
            {cancelText}
          </button>

          <button
            onClick={onOk}
            className="
              rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow
              hover:bg-blue-700
            "
          >
            {okText}
          </button>
        </div>
      </div>
    </div>
  );
};
