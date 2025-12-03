import { Chart, type ChartSeries } from "@/shared/components/Chart";
import { SystemStatus } from "@/features/system/components/SystemStatus";
import { formatCurrency } from "@/shared/utils/format";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MetricsFilterBar } from "@/features/dashboard/components/MetricsFilterBar";
import { MetricsSummaryCards } from "@/features/dashboard/components/MetricsSummaryCards";
import { useDashboardMetrics } from "@/features/dashboard/hooks/useDashboardMetrics";
import { useDashboardParams } from "@/features/dashboard/hooks/useDashboardParams";

const COST_SERIES: ChartSeries<Record<string, unknown>>[] = [
  { key: "total_cost_usd", label: "Total Cost", color: "#3b82f6", valueFormatter: (value) => formatCurrency(value, "USD") },
  { key: "cpu_cost_usd", label: "CPU", color: "#10b981", valueFormatter: (value) => formatCurrency(value, "USD") },
  { key: "memory_cost_usd", label: "Memory", color: "#f97316", valueFormatter: (value) => formatCurrency(value, "USD") },
  { key: "storage_cost_usd", label: "Storage", color: "#8b5cf6", valueFormatter: (value) => formatCurrency(value, "USD") },
];

export const DashboardPage = () => {
  const { params, updateParam } = useDashboardParams();
  const { summary, trends, isLoading, nodesError, refetchAll } = useDashboardMetrics(params);

  const chartData = trends ?? [];

  const nodeErrorMessage =
    nodesError instanceof Error ? nodesError.message : typeof nodesError === "string" ? nodesError : undefined;

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader onRefresh={refetchAll} />

      <MetricsFilterBar params={params} onChange={updateParam} onRefresh={refetchAll} />

      <MetricsSummaryCards summary={summary} isLoading={isLoading} />

      <div className="grid grid-cols-1 gap-6">
        <div className="lg:col-span-12">
          <Chart
            title="Cluster Cost Trend"
            subtitle="Cost components over the selected window"
            metrics={chartData}
            series={COST_SERIES}
            isLoading={isLoading}
            error={nodeErrorMessage}
            getXAxisLabel={(point: Record<string, unknown>) => {
              const timestamp = (point.time as string | undefined) ?? (point.timestamp as string | undefined);
              return timestamp ? new Date(timestamp).toLocaleString() : "";
            }}
          />
        </div>
      </div>

      {/* Node table removed per request */}

      <SystemStatus />
    </div>
  );
};
