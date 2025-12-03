import { useCallback, useMemo, useState } from "react";

interface PdfPrintOverlayProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  documentTitle?: string;
  documentFields?: { label: string; value: string }[];
  generatedAt?: string;
}

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

export const PdfPrintOverlay = ({
  open,
  onClose,
  title = "Export to PDF",
  subtitle = "Render an A4-ready PDF with your report data.",
  documentTitle = "RustCost Report",
  documentFields = [],
  generatedAt,
}: PdfPrintOverlayProps) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timestamp = useMemo(
    () => generatedAt ?? new Date().toLocaleString(),
    [generatedAt]
  );

  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    setError(null);

    try {
      const printWindow = window.open("", "_blank", "width=900,height=1200");
      if (!printWindow) {
        throw new Error("Unable to open print window");
      }

      printWindow.document.write(`
        <html>
          <head>
            <style>
              @page { size: A4; margin: 0; }
              body {
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: flex-start;
                background: #f5f5f5;
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
                color: #0f172a;
              }
              .page {
                width: ${A4_WIDTH_MM}mm;
                min-height: ${A4_HEIGHT_MM}mm;
                box-shadow: 0 6px 30px rgba(0,0,0,0.15);
                background: white;
                display: flex;
                flex-direction: column;
              }
              .page__header {
                padding: 18px 22px;
                border-bottom: 1px solid #e2e8f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .brand {
                font-size: 14px;
                letter-spacing: 0.28em;
                color: #f59e0b;
                text-transform: uppercase;
                font-weight: 700;
              }
              .title-block {
                display: flex;
                flex-direction: column;
                gap: 2px;
              }
              .title {
                font-size: 20px;
                font-weight: 700;
                color: #0f172a;
              }
              .meta {
                font-size: 12px;
                color: #64748b;
              }
              .fields {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px;
                padding: 16px 22px;
                background: #f8fafc;
                border-bottom: 1px solid #e2e8f0;
              }
              .field {
                padding: 10px 12px;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                background: white;
              }
              .field-label {
                font-size: 12px;
                color: #94a3b8;
                text-transform: uppercase;
                letter-spacing: 0.08em;
              }
              .field-value {
                margin-top: 4px;
                font-size: 14px;
                font-weight: 600;
                color: #0f172a;
              }
              .capture {
                width: 100%;
                padding: 16px 22px 22px;
              }
              .placeholder {
                width: 100%;
                height: ${A4_HEIGHT_MM / 2}mm;
                border: 1px dashed #e2e8f0;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #94a3b8;
                font-size: 13px;
                background: #f8fafc;
              }
            </style>
          </head>
          <body>
            <div class="page">
              <div class="page__header">
                <div class="title-block">
                  <span class="brand">RustCost</span>
                  <span class="title">${documentTitle}</span>
                  <span class="meta">Generated: ${timestamp}</span>
                </div>
              </div>
              ${
                documentFields.length
                  ? `<div class="fields">
                      ${documentFields
                        .map(
                          (field) => `
                            <div class="field">
                              <div class="field-label">${field.label}</div>
                              <div class="field-value">${field.value}</div>
                            </div>
                          `
                        )
                        .join("")}
                     </div>`
                  : ""
              }
              <div class="capture">
                <div class="placeholder">
                  Render charts or additional content here.
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        onClose();
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate PDF preview";
      setError(message);
    } finally {
      setIsPrinting(false);
    }
  }, [documentFields, documentTitle, onClose, timestamp]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-4xl rounded-2xl bg-[var(--surface)] p-6 text-[var(--text)] shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
              PDF Export
            </p>
            <h2 className="mt-1 text-2xl font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm font-semibold text-[var(--text-muted)] hover:bg-[color:var(--bg-subtle)]"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-[color:var(--border)] bg-white/80 p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
                    RustCost
                  </p>
                  <h3 className="text-lg font-semibold text-[var(--text)]">
                    {documentTitle}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {timestamp}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {documentFields.map((field) => (
                  <div
                    key={field.label}
                    className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
                      {field.label}
                    </p>
                    <p className="text-sm font-semibold text-[var(--text)]">
                      {field.value}
                    </p>
                  </div>
                ))}
              </div>

              <div
                className="mx-auto flex items-center justify-center rounded-lg border border-dashed border-[color:var(--border)] bg-[color:var(--bg-subtle)] p-4"
                style={{
                  width: `${A4_WIDTH_MM / 2}mm`,
                  height: `${A4_HEIGHT_MM / 2}mm`,
                }}
              >
                <p className="text-xs text-[var(--text-muted)] text-center">
                  A preview of document layout (A4). Charts or extra content can
                  be injected here later.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm">
            <p className="text-sm font-semibold text-[var(--text)]">Options</p>
            <p className="text-xs text-[var(--text-subtle)]">
              Render a clean A4 PDF using the data shown on the left. This uses a
              light theme regardless of app mode.
            </p>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handlePrint}
                disabled={isPrinting}
                className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[color:var(--primary-hover)] disabled:opacity-60"
              >
                {isPrinting ? "Generating..." : "Print / Save PDF"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] hover:bg-[color:var(--bg-subtle)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
