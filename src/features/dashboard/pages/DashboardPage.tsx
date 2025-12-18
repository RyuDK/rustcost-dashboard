import { useMemo, useState } from "react";
import {
  SharedMetricChart,
  type ChartSeries,
} from "@/shared/components/chart/SharedMetricChart";
import { SystemStatus } from "@/features/system/components/SystemStatus";
import { formatCurrency } from "@/shared/utils/format";
import { SharedMetricsFilterBar } from "@/shared/components/filter/SharedMetricsFilterBar";
import { SharedMetricsSummaryCards } from "@/shared/components/metrics/SharedMetricsSummaryCards";
import { PdfPrintOverlay } from "@/shared/components/PdfPrintOverlay";
import { useDashboardMetrics } from "@/features/dashboard/hooks/useDashboardMetrics";
import { useDashboardParams } from "@/features/dashboard/hooks/useDashboardParams";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { ExplainHint } from "@/shared/components/ExplainHint";
import { formatDateTime, useTimezone } from "@/shared/time";

export const DashboardPage = () => {
  const { params, updateParam } = useDashboardParams();
  const { summary, trends, isLoading, error, refetchAll } =
    useDashboardMetrics(params);
  const { t } = useI18n();
  const [showPrint, setShowPrint] = useState(false);
  const { timeZone } = useTimezone();

  const breadcrumbItems = useMemo(() => [{ label: t("nav.dashboard") }], [t]);

  const costSeries = useMemo<ChartSeries<Record<string, unknown>>[]>(
    () => [
      {
        key: "total_cost_usd",
        label: t("dashboard.costSeries.totalCost"),
        color: "#3b82f6",
        valueFormatter: (value) => formatCurrency(value, "USD"),
      },
      {
        key: "cpu_cost_usd",
        label: t("dashboard.costSeries.cpu"),
        color: "#10b981",
        valueFormatter: (value) => formatCurrency(value, "USD"),
      },
      {
        key: "memory_cost_usd",
        label: t("dashboard.costSeries.memory"),
        color: "#f97316",
        valueFormatter: (value) => formatCurrency(value, "USD"),
      },
      {
        key: "storage_cost_usd",
        label: t("dashboard.costSeries.storage"),
        color: "#8b5cf6",
        valueFormatter: (value) => formatCurrency(value, "USD"),
      },
    ],
    [t]
  );

  const summaryCards = useMemo(() => {
    const cost = summary.cost?.summary;
    return [
      {
        label: t("dashboard.summary.totalCost.label"),
        value: formatCurrency(cost?.total_cost_usd ?? 0, "USD"),
        description: t("dashboard.summary.totalCost.description"),
      },
      {
        label: t("dashboard.summary.cpuCost.label"),
        value: formatCurrency(cost?.cpu_cost_usd ?? 0, "USD"),
        description: t("dashboard.summary.cpuCost.description"),
      },
      {
        label: t("dashboard.summary.memoryCost.label"),
        value: formatCurrency(cost?.memory_cost_usd ?? 0, "USD"),
        description: t("dashboard.summary.memoryCost.description"),
      },
      {
        label: t("dashboard.summary.storageNetwork.label"),
        value: formatCurrency(
          (cost?.ephemeral_storage_cost_usd ?? 0) +
            (cost?.persistent_storage_cost_usd ?? 0) +
            (cost?.network_cost_usd ?? 0),
          "USD"
        ),
        description: t("dashboard.summary.storageNetwork.description"),
      },
    ];
  }, [summary.cost, t]);

  const costFields = useMemo(() => {
    const cost = summary.cost?.summary;
    if (!cost) return [];
    return [
      {
        label: t("dashboard.summary.totalCost.label"),
        value: formatCurrency(cost.total_cost_usd ?? 0, "USD"),
      },
      {
        label: t("dashboard.summary.cpuCost.label"),
        value: formatCurrency(cost.cpu_cost_usd ?? 0, "USD"),
      },
      {
        label: t("dashboard.summary.memoryCost.label"),
        value: formatCurrency(cost.memory_cost_usd ?? 0, "USD"),
      },
      {
        label: t("dashboard.costFields.storageCost"),
        value: formatCurrency(
          (cost.ephemeral_storage_cost_usd ?? 0) +
            (cost.persistent_storage_cost_usd ?? 0),
          "USD"
        ),
      },
      {
        label: t("dashboard.costFields.networkCost"),
        value: formatCurrency(cost.network_cost_usd ?? 0, "USD"),
      },
    ];
  }, [summary.cost, t]);

  const chartData = trends ?? [];

  const chartErrorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : undefined;

  return (
    <SharedPageLayout>
      <SharedPageHeader
        eyebrow=""
        title={t("dashboard.title")}
        description={t("dashboard.subtitle")}
        breadcrumbItems={breadcrumbItems}
        primaryAction={{
          label: t("dashboard.actions.exportPdf"),
          onClick: () => setShowPrint(true),
        }}
      />

      <SharedMetricsFilterBar
        params={params}
        onChange={updateParam}
        onRefresh={refetchAll}
      />

      <ExplainHint>
        {t("dashboard.hints.filters")}
      </ExplainHint>

      <SharedMetricsSummaryCards cards={summaryCards} isLoading={isLoading} />

      <ExplainHint>
        {t("dashboard.hints.summaryCards")}
      </ExplainHint>

      <div className="grid grid-cols-1 gap-6">
        <div className="lg:col-span-12">
          <SharedMetricChart
            title={t("dashboard.chart.title")}
            subtitle={t("dashboard.chart.subtitle")}
            metrics={chartData}
            series={costSeries}
            isLoading={isLoading}
            error={chartErrorMessage}
            getXAxisLabel={(point: Record<string, unknown>) => {
              const timestamp =
                (point.time as string | undefined) ??
                (point.timestamp as string | undefined);
              return timestamp ? formatDateTime(timestamp, { timeZone }) : "";
            }}
          />
        </div>
      </div>

      <ExplainHint>
        {t("dashboard.hints.costTrend")}
      </ExplainHint>

      {/* Node table removed per request */}

      <SystemStatus />

      <ExplainHint>
        {t("dashboard.hints.systemStatus")}
      </ExplainHint>

      <PdfPrintOverlay
        open={showPrint}
        onClose={() => setShowPrint(false)}
        documentTitle={t("dashboard.pdf.documentTitle")}
        documentFields={costFields}
      />
    </SharedPageLayout>
  );
};
