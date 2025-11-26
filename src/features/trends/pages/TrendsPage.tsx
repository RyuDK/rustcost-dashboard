import { useState } from "react";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { TrendChart } from "@/features/trends/components/TrendChart";
import { createDefaultMetricsParams } from "@/features/dashboard/hooks/useMetrics";
import {
  useClusterTrendMetrics,
  useNamespaceTrendMetrics,
} from "@/features/metrics/hooks/resourceHooks";

export const TrendsPage = () => {
  const { t } = useI18n();
  const [params, setParams] = useState(() => createDefaultMetricsParams());
  const clusterTrends = useClusterTrendMetrics(params);
  const namespaceTrends = useNamespaceTrendMetrics({
    ...params,
    metric: ["cpuUsage"],
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {t("trends.title")}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("trends.subtitle")}
        </p>
      </header>

      <section className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col">
          <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("common.date.start")}
          </label>
          <input
            type="date"
            value={params.start?.slice(0, 10) ?? ""} // ensures the input displays correctly
            onChange={(event) =>
              setParams((prev) => ({
                ...prev,
                start: event.target.value
                  ? `${event.target.value}T00:00:00`
                  : "",
              }))
            }
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("common.date.end")}
          </label>
          <input
            type="date"
            value={params.end?.slice(0, 10) ?? ""}
            onChange={(event) =>
              setParams((prev) => ({
                ...prev,
                end: event.target.value ? `${event.target.value}T23:59:59` : "",
              }))
            }
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </section>

      <TrendChart
        title={t("trends.chart.cluster")}
        data={clusterTrends.data}
        isLoading={clusterTrends.isLoading}
        error={
          clusterTrends.error instanceof Error
            ? clusterTrends.error.message
            : clusterTrends.error
            ? String(clusterTrends.error)
            : undefined
        }
      />
      <TrendChart
        title={t("trends.chart.namespace")}
        data={namespaceTrends.data}
        isLoading={namespaceTrends.isLoading}
        error={
          namespaceTrends.error instanceof Error
            ? namespaceTrends.error.message
            : namespaceTrends.error
            ? String(namespaceTrends.error)
            : undefined
        }
      />
    </div>
  );
};
