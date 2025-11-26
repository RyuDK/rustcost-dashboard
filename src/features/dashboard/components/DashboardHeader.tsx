import { useI18n } from "@/app/providers/I18nProvider";

interface DashboardHeaderProps {
  onRefresh?: () => void;
  onExport?: () => void;
}

export const DashboardHeader = ({
  onRefresh,
  onExport,
}: DashboardHeaderProps) => {
  const { t } = useI18n();

  // useEffect(() => {
  //   if (range.rangeType === "preset") {
  //     fetchMetrics({ days: range.days });
  //   } else {
  //     fetchMetrics({ start: range.startDate, end: range.endDate });
  //   }
  // }, [range]);
  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
          RustCost
        </p>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {t("dashboard.title")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("dashboard.subtitle")}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-end gap-3 ml-auto">
        <button
          type="button"
          onClick={onExport}
          className="
      rounded-lg px-4 py-2 text-sm font-medium
      border border-var-border bg-var-surface-raised text-var-text
      hover:border-var-border-strong transition
    "
        >
          Export
        </button>

        <button
          type="button"
          onClick={onRefresh}
          className="
      rounded-lg px-4 py-2 text-sm font-semibold
      bg-var-primary hover:bg-var-primary-hover
      text-var-accent-contrast transition
    "
        >
          {t("common.refresh")}
        </button>
      </div>
    </header>
  );
};
