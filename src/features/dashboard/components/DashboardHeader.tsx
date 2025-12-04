import { useI18n } from "@/app/providers/i18n/useI18n";

interface DashboardHeaderProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  refreshLabel?: string;
  exportLabel?: string;
  actions?: React.ReactNode;
}

export const DashboardHeader = ({
  eyebrow,
  title,
  subtitle,
  onExport,
  exportLabel,
  actions,
}: DashboardHeaderProps) => {
  const { t } = useI18n();

  const displayEyebrow = eyebrow ?? "RustCost";
  const displayTitle = title ?? t("dashboard.title");
  const displaySubtitle = subtitle ?? t("dashboard.subtitle");
  const displayExportLabel = exportLabel ?? "Export CSV";
  const displayExportPdfLabel = "Export PDF";

  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
          {displayEyebrow}
        </p>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {displayTitle}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {displaySubtitle}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-end gap-3 ml-auto">
        {actions}
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="
            hidden
              rounded-lg px-4 py-2 text-sm font-medium
              border border-var-border bg-var-surface-raised text-var-text
              hover:border-var-border-strong transition
            "
          >
            {displayExportLabel}
          </button>
        )}

        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="
              rounded-lg px-4 py-2 text-sm font-medium
              border border-var-border bg-var-surface-raised text-var-text
              hover:border-var-border-strong transition
            "
          >
            {displayExportPdfLabel}
          </button>
        )}
      </div>
    </header>
  );
};
