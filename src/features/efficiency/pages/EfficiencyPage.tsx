import { useCallback, useMemo, useState } from "react";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { SharedMetricsFilterBar } from "@/shared/components/filter/SharedMetricsFilterBar";
import { SharedMetricsSummaryCards } from "@/shared/components/metrics/SharedMetricsSummaryCards";
import { SharedCard } from "@/shared/components/metrics/SharedCard";
import { useNodeEfficiencyMetrics } from "@/features/metrics/hooks/resourceHooks";
import { getDefaultDateRange, formatDateTime } from "@/shared/utils/date";
import { withAutoGranularity } from "@/shared/utils/metrics";
import { formatPercent } from "@/shared/utils/format";
import type { MetricsQueryOptions } from "@/types/metrics";
import { useAppSelector } from "@/store/hook";
import { ExplainHint } from "@/shared/components/ExplainHint";

const toPercentLabel = (value?: number) => formatPercent((value ?? 0) * 100);
const percentWidth = (value?: number) =>
  `${Math.min(100, Math.max(0, (value ?? 0) * 100)).toFixed(1)}%`;

export const EfficiencyPage = () => {
  const { t } = useI18n();
  const formatCores = (value?: number) =>
    value !== undefined && value !== null
      ? t("common.units.cores", { value: value.toFixed(2) })
      : t("common.notAvailable");

  const formatGigabytes = (value?: number) =>
    value !== undefined && value !== null
      ? t("common.units.gigabytes", { value: value.toFixed(1) })
      : t("common.notAvailable");
  const [params, setParams] = useState<MetricsQueryOptions>(() => {
    const range = getDefaultDateRange();
    return withAutoGranularity(range) ?? range;
  });
  const showExplain = useAppSelector((state) => state.preferences.showExplain);

  const nodeEfficiency = useNodeEfficiencyMetrics(params);
  const errorMessage = nodeEfficiency.error
    ? nodeEfficiency.error instanceof Error
      ? nodeEfficiency.error.message
      : String(nodeEfficiency.error)
    : null;
  const granularity =
    nodeEfficiency.data?.granularity ?? params.granularity ?? "day";

  const summaryCards = useMemo(
    () => [
      {
        label: t("efficiency.summary.overall.label"),
        value: toPercentLabel(nodeEfficiency.data?.overall_efficiency),
        description: t("efficiency.summary.overall.description", {
          granularity,
        }),
      },
      {
        label: t("efficiency.summary.cpu.label"),
        value: toPercentLabel(nodeEfficiency.data?.cpu_efficiency),
        description: nodeEfficiency.data?.total_cpu_allocatable_cores
          ? t("efficiency.summary.allocatable", {
              value: formatCores(
                nodeEfficiency.data.total_cpu_allocatable_cores
              ),
            })
          : undefined,
      },
      {
        label: t("efficiency.summary.memory.label"),
        value: toPercentLabel(nodeEfficiency.data?.memory_efficiency),
        description: nodeEfficiency.data?.total_memory_allocatable_gb
          ? t("efficiency.summary.allocatable", {
              value: formatGigabytes(
                nodeEfficiency.data.total_memory_allocatable_gb
              ),
            })
          : undefined,
      },
      {
        label: t("efficiency.summary.storage.label"),
        value: toPercentLabel(nodeEfficiency.data?.storage_efficiency),
        description: nodeEfficiency.data?.total_storage_allocatable_gb
          ? t("efficiency.summary.allocatable", {
              value: formatGigabytes(
                nodeEfficiency.data.total_storage_allocatable_gb
              ),
            })
          : undefined,
      },
    ],
    [formatCores, formatGigabytes, granularity, nodeEfficiency.data, t]
  );

  const efficiencyRows = useMemo(
    () => [
      {
        key: "cpu",
        label: t("common.resources.cpu"),
        value: nodeEfficiency.data?.cpu_efficiency,
      },
      {
        key: "memory",
        label: t("common.resources.memory"),
        value: nodeEfficiency.data?.memory_efficiency,
      },
      {
        key: "storage",
        label: t("common.resources.storage"),
        value: nodeEfficiency.data?.storage_efficiency,
      },
    ],
    [nodeEfficiency.data, t]
  );

  const handleParamsChange = useCallback(
    <K extends keyof MetricsQueryOptions>(
      key: K,
      value: MetricsQueryOptions[K]
    ) => {
      setParams((prev) => {
        const next = { ...prev, [key]: value };
        const normalized = withAutoGranularity(next);
        return normalized ?? next;
      });
    },
    []
  );

  return (
    <SharedPageLayout>
      <SharedPageHeader
        eyebrow=""
        title={t("efficiency.title")}
        description={t("efficiency.subtitle")}
        breadcrumbItems={[{ label: t("nav.efficiency") }]}
      />

      <SharedMetricsFilterBar
        params={params}
        onChange={handleParamsChange}
        onRefresh={nodeEfficiency.refetch}
      />

      <ExplainHint visible={showExplain}>
        {t("efficiency.hints.filters")}
      </ExplainHint>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          {errorMessage}
        </div>
      )}

      <SharedMetricsSummaryCards
        cards={summaryCards}
        isLoading={nodeEfficiency.isLoading}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SharedCard
          title={t("efficiency.resourceCard.title")}
          subtitle={t("efficiency.resourceCard.subtitle")}
          isLoading={nodeEfficiency.isLoading}
        >
          <ExplainHint visible={showExplain}>
            {t("efficiency.hints.resourceCard")}
          </ExplainHint>
          <div className="space-y-4">
            {efficiencyRows.map((row) => (
              <div key={row.key} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-gray-100">
                  <span>{row.label}</span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {toPercentLabel(row.value)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-[width]"
                    style={{ width: percentWidth(row.value) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SharedCard>

        <SharedCard
          title={t("efficiency.snapshotCard.title")}
          subtitle={t("efficiency.snapshotCard.subtitle")}
          isLoading={nodeEfficiency.isLoading}
        >
          <dl className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
            <div className="flex items-center justify-between">
              <dt className="text-gray-500 dark:text-gray-400">
                {t("common.date.start")}
              </dt>
              <dd className="font-semibold">
                {formatDateTime(
                  nodeEfficiency.data?.start ?? params.start ?? ""
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500 dark:text-gray-400">
                {t("common.date.end")}
              </dt>
              <dd className="font-semibold">
                {formatDateTime(nodeEfficiency.data?.end ?? params.end ?? "")}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500 dark:text-gray-400">
                {t("efficiency.snapshotCard.granularityLabel")}
              </dt>
              <dd className="font-semibold capitalize">{granularity}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500 dark:text-gray-400">
                {t("efficiency.snapshotCard.cpuAllocatable")}
              </dt>
              <dd className="font-semibold">
                {formatCores(nodeEfficiency.data?.total_cpu_allocatable_cores)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500 dark:text-gray-400">
                {t("efficiency.snapshotCard.memoryAllocatable")}
              </dt>
              <dd className="font-semibold">
                {formatGigabytes(
                  nodeEfficiency.data?.total_memory_allocatable_gb
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500 dark:text-gray-400">
                {t("efficiency.snapshotCard.storageAllocatable")}
              </dt>
              <dd className="font-semibold">
                {formatGigabytes(
                  nodeEfficiency.data?.total_storage_allocatable_gb
                )}
              </dd>
            </div>
          </dl>
        </SharedCard>
      </div>
    </SharedPageLayout>
  );
};
