import { useState } from "react";
import { Chart, type ChartSeries } from "@/shared/components/Chart";
import { SystemStatus } from "@/features/system/components/SystemStatus";
import { formatCurrency } from "@/shared/utils/format";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MetricsFilterBar } from "@/features/dashboard/components/MetricsFilterBar";
import { MetricsSummaryCards } from "@/features/dashboard/components/MetricsSummaryCards";
import { PdfPrintOverlay } from "@/shared/components/PdfPrintOverlay";
import { useDashboardMetrics } from "@/features/dashboard/hooks/useDashboardMetrics";
import { useDashboardParams } from "@/features/dashboard/hooks/useDashboardParams";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { useMemo } from "react";

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

  const costFields = useMemo(() => {
    const cost = summary.cost?.summary;
    if (!cost) return [];
    return [
      { label: "Total Cost", value: formatCurrency(cost.total_cost_usd ?? 0, "USD") },
      { label: "CPU Cost", value: formatCurrency(cost.cpu_cost_usd ?? 0, "USD") },
      { label: "Memory Cost", value: formatCurrency(cost.memory_cost_usd ?? 0, "USD") },
      {
        label: "Storage Cost",
        value: formatCurrency(
          (cost.ephemeral_storage_cost_usd ?? 0) + (cost.persistent_storage_cost_usd ?? 0),
          "USD"
        ),
      },
      { label: "Network Cost", value: formatCurrency(cost.network_cost_usd ?? 0, "USD") },
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
    <div className="flex flex-col gap-8">
      <DashboardHeader
        eyebrow="RustCost"
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        onRefresh={refetchAll}
        onExport={() => setShowPrint(true)}
      />

      <MetricsFilterBar
        params={params}
        onChange={updateParam}
        onRefresh={refetchAll}
      />

      <MetricsSummaryCards summary={summary} isLoading={isLoading} />

      <div className="grid grid-cols-1 gap-6">
        <div className="lg:col-span-12">
          <Chart
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
              return timestamp ? new Date(timestamp).toLocaleString() : "";
            }}
          />
        </div>
      </div>

      {/* Node table removed per request */}

      <SystemStatus />

      <PdfPrintOverlay
        open={showPrint}
        onClose={() => setShowPrint(false)}
        documentTitle="RustCost Cost Report"
        documentFields={costFields}
      />
    </div>
  );
};
