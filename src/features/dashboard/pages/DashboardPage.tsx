import { useMemo, useState } from "react";
import { useI18n } from "../../../app/providers/I18nProvider";
import { MetricChart } from "../../../shared/components/MetricChart";
import { MetricTable } from "../../../shared/components/MetricTable";
import { SystemStatus } from "../../system/components/SystemStatus";
import { OverviewPanel } from "../components/OverviewPanel";
import {
  createDefaultMetricsParams,
  useNodesMetrics,
  usePodsEfficiency,
} from "../hooks/useMetrics";
import { formatBytes, formatCpu, formatCurrency, formatPercent } from "../../../shared/lib/formatters";

export const DashboardPage = () => {
  const { t } = useI18n();
  const [params, setParams] = useState(() => createDefaultMetricsParams());

  const nodes = useNodesMetrics(params);
  const pods = usePodsEfficiency({ ...params, sort: "efficiencyScore:desc" });

  const chartSeries = useMemo(
    () => [
      { key: "cpuUsage" as const, label: "CPU (mCores)", color: "#f59e0b" },
      { key: "memoryUsage" as const, label: "Memory (Bytes)", color: "#38bdf8" },
    ],
    []
  );

  const handleDateChange = (key: "start" | "end") => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const limit = Number(event.target.value);
    setParams((prev) => ({
      ...prev,
      limit,
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {t("dashboard.title")}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("dashboard.subtitle")}</p>
      </header>

      <section className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col">
          <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("common.date.start")}
          </label>
          <input
            type="date"
            value={params.start}
            onChange={handleDateChange("start")}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("common.date.end")}
          </label>
          <input
            type="date"
            value={params.end}
            onChange={handleDateChange("end")}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("common.limit")}
          </label>
          <select
            value={params.limit}
            onChange={handleLimitChange}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            {[10, 25, 50, 100].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => {
            void Promise.all([nodes.refetch(), pods.refetch()]);
          }}
          className="ml-auto rounded-md border border-amber-500 px-4 py-2 text-sm font-medium text-amber-600 transition hover:bg-amber-500/10 dark:text-amber-300"
        >
          {t("common.refresh")}
        </button>
      </section>

      <OverviewPanel
        nodes={nodes.data.summary}
        pods={pods.data.summary}
        efficiency={pods.data.efficiency}
        isLoading={nodes.isLoading || pods.isLoading}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <MetricChart
            title={t("dashboard.metrics.nodes")}
            metrics={nodes.data.trends}
            series={chartSeries}
            isLoading={nodes.isLoading}
            error={
              nodes.error instanceof Error
                ? nodes.error.message
                : nodes.error
                  ? String(nodes.error)
                  : undefined
            }
          />
        </div>
        <div className="lg:col-span-5">
          <MetricTable
            title={t("dashboard.metrics.pods")}
            data={pods.data.efficiency.slice(0, params.limit ?? 10)}
            columns={[
              {
                key: "name",
                header: "Pod",
                render: (item) => item.name,
              },
              {
                key: "efficiency",
                header: "Efficiency",
                render: (item) => formatPercent(item.efficiencyScore),
              },
              {
                key: "cpu",
                header: "CPU",
                align: "right",
                render: (item) => formatCpu(item.cpuEfficiency ?? 0),
              },
              {
                key: "memory",
                header: "Memory",
                align: "right",
                render: (item) => formatBytes(item.memoryEfficiency ?? 0),
              },
              {
                key: "cost",
                header: "Cost",
                align: "right",
                render: (item) =>
                  formatCurrency(item.costEfficiency ?? 0, "USD"),
              },
            ]}
            isLoading={pods.isLoading}
            error={
              pods.error instanceof Error
                ? pods.error.message
                : pods.error
                  ? String(pods.error)
                  : undefined
            }
          />
        </div>
      </div>

      <SystemStatus />
    </div>
  );
};
