import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";

type LoadingAlertProps = {
  open: boolean;
  title: string;
  message: string;
  detail?: string;
  onOk: () => void;
  onCancel: () => void;
  tone?: "info" | "error";
};

export const LoadingAlert = ({
  open,
  title,
  message,
  detail,
  onOk,
  onCancel,
  tone = "info",
}: LoadingAlertProps) => {
  const headerClass =
    tone === "error" ? "text-red-700" : "text-slate-900";
  const detailClass =
    tone === "error" ? "text-red-600" : "text-slate-600";

  return (
    <Popup
      open={open}
      modal
      closeOnEscape
      closeOnDocumentClick={false}
      onClose={onCancel}
      contentStyle={{
        padding: 0,
        borderRadius: "16px",
        width: "min(440px, 92vw)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        color: "var(--text)",
        overflow: "hidden",
      }}
      overlayStyle={{ background: "var(--overlay)" }}
    >
      <div className="bg-[var(--surface)] p-6 text-[var(--text)]">
        <h3 className={`text-xl font-semibold ${headerClass}`}>{title}</h3>
        <p className="mt-4 text-base text-[var(--text)]">{message}</p>
        {detail && <p className={`mt-2 text-sm ${detailClass}`}>{detail}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-wide transition bg-[var(--surface)] text-[color:var(--primary)] border-[color:var(--primary)] hover:bg-[color:var(--bg-subtle)]"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={onOk}
            className="rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[var(--accent-contrast)] shadow-sm transition bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
          >
            OK
          </button>
        </div>
      </div>
    </Popup>
  );
};
