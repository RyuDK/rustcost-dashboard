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
import { useAppSelector } from "@/store/hook";
import { ExplainHint } from "@/shared/components/ExplainHint";
import { formatDateTime, useTimezone } from "@/shared/time";

const COST_SERIES: ChartSeries<Record<string, unknown>>[] = [
  {
    key: "total_cost_usd",
    label: "Total Cost",
    color: "#3b82f6",
    valueFormatter: (value) => formatCurrency(value, "USD"),
  },
  {
    key: "cpu_cost_usd",
    label: "CPU",
    color: "#10b981",
    valueFormatter: (value) => formatCurrency(value, "USD"),
  },
  {
    key: "memory_cost_usd",
    label: "Memory",
    color: "#f97316",
    valueFormatter: (value) => formatCurrency(value, "USD"),
  },
  {
    key: "storage_cost_usd",
    label: "Storage",
    color: "#8b5cf6",
    valueFormatter: (value) => formatCurrency(value, "USD"),
  },
];

export const DashboardPage = () => {
  const { params, updateParam } = useDashboardParams();
  const { summary, trends, isLoading, error, refetchAll } =
    useDashboardMetrics(params);
  const { t } = useI18n();
  const [showPrint, setShowPrint] = useState(false);
  const showExplain = useAppSelector((state) => state.preferences.showExplain);
  const { timeZone } = useTimezone();

  const breadcrumbItems = useMemo(() => [{ label: t("nav.dashboard") }], [t]);

  const summaryCards = useMemo(() => {
    const cost = summary.cost?.summary;
    return [
      {
        label: "Total Cost",
        value: formatCurrency(cost?.total_cost_usd ?? 0, "USD"),
        description: "All cluster costs",
      },
      {
        label: "CPU Cost",
        value: formatCurrency(cost?.cpu_cost_usd ?? 0, "USD"),
        description: "Compute spend",
      },
      {
        label: "Memory Cost",
        value: formatCurrency(cost?.memory_cost_usd ?? 0, "USD"),
        description: "RAM spend",
      },
      {
        label: "Storage + Network",
        value: formatCurrency(
          (cost?.ephemeral_storage_cost_usd ?? 0) +
            (cost?.persistent_storage_cost_usd ?? 0) +
            (cost?.network_cost_usd ?? 0),
          "USD"
        ),
        description: "Ephemeral, persistent, network",
      },
    ];
  }, [summary.cost]);

  const costFields = useMemo(() => {
    const cost = summary.cost?.summary;
    if (!cost) return [];
    return [
      {
        label: "Total Cost",
        value: formatCurrency(cost.total_cost_usd ?? 0, "USD"),
      },
      {
        label: "CPU Cost",
        value: formatCurrency(cost.cpu_cost_usd ?? 0, "USD"),
      },
      {
        label: "Memory Cost",
        value: formatCurrency(cost.memory_cost_usd ?? 0, "USD"),
      },
      {
        label: "Storage Cost",
        value: formatCurrency(
          (cost.ephemeral_storage_cost_usd ?? 0) +
            (cost.persistent_storage_cost_usd ?? 0),
          "USD"
        ),
      },
      {
        label: "Network Cost",
        value: formatCurrency(cost.network_cost_usd ?? 0, "USD"),
      },
    ];
  }, [summary.cost]);

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
          label: "Export PDF",
          onClick: () => setShowPrint(true),
        }}
      />

      <SharedMetricsFilterBar
        params={params}
        onChange={updateParam}
        onRefresh={refetchAll}
      />

      {showExplain && (
        <ExplainHint>
          Filters apply to every widget below. Set your date range, then hit
          refresh to pull aligned data across the dashboard.
        </ExplainHint>
      )}

      <SharedMetricsSummaryCards cards={summaryCards} isLoading={isLoading} />

      {showExplain && (
        <ExplainHint>
          Summary cards show total, CPU, memory, and storage+network costs for
          the selected window. They refresh with the filter above.
        </ExplainHint>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="lg:col-span-12">
          <SharedMetricChart
            title="Cluster Cost Trend"
            subtitle="Cost components over the selected window"
            metrics={chartData}
            series={COST_SERIES}
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

      {showExplain && (
        <ExplainHint>
          The cost trend plots each cost component over time. Hover for exact
          values; the X-axis follows your chosen date range.
        </ExplainHint>
      )}

      {/* Node table removed per request */}

      <SystemStatus />

      {showExplain && (
        <ExplainHint>
          System Status summarizes platform health and alerts reported by
          backend services.
        </ExplainHint>
      )}

      <PdfPrintOverlay
        open={showPrint}
        onClose={() => setShowPrint(false)}
        documentTitle="RustCost Cost Report"
        documentFields={costFields}
      />
    </SharedPageLayout>
  );
};
