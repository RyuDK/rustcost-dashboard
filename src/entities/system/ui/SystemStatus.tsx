import { useCallback } from "react";
import { useI18n } from "../../../app/providers/I18nProvider";
import { LoadingSpinner } from "../../../shared/components/LoadingSpinner";
import { useSystemStatus } from "../api/endpoints/status";
import { useSystemBackup } from "../api/endpoints/backup";
import { useSystemResync } from "../api/endpoints/resync";
import type { SystemComponentStatus } from "../api/types";

const badgeColor = (status: SystemComponentStatus["status"]) => {
  switch (status) {
    case "healthy":
      return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300";
    case "degraded":
    case "warning":
      return "bg-amber-500/20 text-amber-600 dark:text-amber-300";
    case "error":
      return "bg-red-500/10 text-red-600 dark:text-red-300";
    default:
      return "bg-slate-500/10 text-slate-500 dark:text-slate-300";
  }
};

export const SystemStatus = () => {
  const { t } = useI18n();
  const status = useSystemStatus({ staleTime: 60_000 });
  const backup = useSystemBackup();
  const resync = useSystemResync();

  const handleRefresh = useCallback(() => {
    void status.refetch();
  }, [status]);

  const handleBackup = useCallback(() => {
    void backup.trigger({ mode: "incremental", includeMetrics: true }).then(() => {
      void status.refetch();
    });
  }, [backup, status]);

  const handleResync = useCallback(() => {
    void resync.trigger({ scope: "all" }).then(() => {
      void status.refetch();
    });
  }, [resync, status]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <header className="flex items-center justify-between pb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t("system.status.title")}
          </h2>
          {status.data?.status === "healthy" ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-300">
              {t("system.status.healthy")}
            </p>
          ) : status.data?.status === "degraded" ? (
            <p className="text-sm text-amber-600 dark:text-amber-300">
              {t("system.status.degraded")}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-md border border-amber-500 px-3 py-1.5 text-sm font-medium text-amber-600 transition hover:bg-amber-500/10 dark:text-amber-300"
          >
            {t("system.status.refresh")}
          </button>
          <button
            type="button"
            onClick={handleBackup}
            disabled={backup.isLoading}
            className="rounded-md border border-sky-500 px-3 py-1.5 text-sm font-medium text-sky-600 transition hover:bg-sky-500/10 disabled:opacity-60 dark:text-sky-300"
          >
            {backup.isLoading ? t("system.status.backingUp") : t("system.status.backup")}
          </button>
          <button
            type="button"
            onClick={handleResync}
            disabled={resync.isLoading}
            className="rounded-md border border-emerald-500 px-3 py-1.5 text-sm font-medium text-emerald-600 transition hover:bg-emerald-500/10 disabled:opacity-60 dark:text-emerald-300"
          >
            {resync.isLoading ? t("system.status.resyncing") : t("system.status.resync")}
          </button>
        </div>
      </header>
      {status.isLoading && <LoadingSpinner label="Checking status" className="py-8" />}
      {status.error && (
        <div className="rounded-md border border-red-400 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-600 dark:bg-red-900/20 dark:text-red-200">
          {status.error instanceof Error ? status.error.message : String(status.error)}
        </div>
      )}
      {status.data && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {status.data.components.map((component) => (
            <div
              key={component.component}
              className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950/60"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {component.component}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColor(component.status)}`}
                >
                  {component.status.toUpperCase()}
                </span>
              </div>
              {component.message && (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  {component.message}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
