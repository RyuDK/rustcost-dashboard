import { useMemo } from "react";
import type { EfficiencyMetric, SummaryMetric } from "@/features/metrics/types";
import { Chart, type ChartSeries } from "@/shared/components/Chart";
import { Table, type TableColumn } from "@/shared/components/Table";
import { SystemStatus } from "@/features/system/components/SystemStatus";
import { formatBytes, formatCpu, formatCurrency, formatPercent } from "@/shared/utils/format";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MetricsFilterBar } from "@/features/dashboard/components/MetricsFilterBar";
import { MetricsSummaryCards } from "@/features/dashboard/components/MetricsSummaryCards";
import { CostEfficiencyCard } from "@/features/dashboard/components/CostEfficiencyCard";
import { useDashboardMetrics } from "@/features/dashboard/hooks/useDashboardMetrics";
import { useDashboardParams } from "@/features/dashboard/hooks/useDashboardParams";

const POD_COLUMNS: TableColumn<EfficiencyMetric>[] = [
  {
    key: "name",
    label: "Pod",
    render: (item) => (
      <div className="flex flex-col">
        <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{item.id}</span>
      </div>
    ),
  },
  {
    key: "efficiencyScore",
    label: "Efficiency",
    align: "right",
    render: (item) => formatPercent(item.efficiencyScore ?? 0),
    sortAccessor: (item) => item.efficiencyScore ?? 0,
    efficiencyAccessor: (item) => item.efficiencyScore ?? 0,
  },
  {
    key: "cpuEfficiency",
    label: "CPU",
    align: "right",
    render: (item) => formatCpu(item.cpuEfficiency ?? 0),
    sortAccessor: (item) => item.cpuEfficiency ?? 0,
  },
  {
    key: "memoryEfficiency",
    label: "Memory",
    align: "right",
    render: (item) => formatBytes(item.memoryEfficiency ?? 0),
    sortAccessor: (item) => item.memoryEfficiency ?? 0,
  },
  {
    key: "costEfficiency",
    label: "Cost",
    align: "right",
    render: (item) => formatCurrency(item.costEfficiency ?? 0, "USD"),
    sortAccessor: (item) => item.costEfficiency ?? 0,
  },
];

const NODE_COLUMNS: TableColumn<SummaryMetric>[] = [
  {
    key: "name",
    label: "Node",
    render: (item) => (
      <div className="flex flex-col">
        <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{item.id}</span>
      </div>
    ),
  },
  {
    key: "cpuUsage",
    label: "CPU",
    align: "right",
    render: (item) => formatCpu(item.cpuUsage ?? 0),
    sortAccessor: (item) => item.cpuUsage ?? 0,
  },
  {
    key: "memoryUsage",
    label: "Memory",
    align: "right",
    render: (item) => formatBytes(item.memoryUsage ?? 0),
    sortAccessor: (item) => item.memoryUsage ?? 0,
  },
  {
    key: "totalCost",
    label: "Cost",
    align: "right",
    render: (item) => formatCurrency(item.totalCost ?? 0, "USD"),
    sortAccessor: (item) => item.totalCost ?? 0,
  },
];

const NODE_SERIES: ChartSeries<Record<string, unknown>>[] = [
  { key: "cpuUsage", label: "CPU (mCores)", color: "#3b82f6", valueFormatter: (value) => formatCpu(value) },
  { key: "memoryUsage", label: "Memory (Bytes)", color: "#10b981", valueFormatter: (value) => formatBytes(value) },
];

export const DashboardPage = () => {
  const { params, updateParam } = useDashboardParams();
  const { summary, trends, efficiency, nodesSummary, isLoading, nodesError, podsError, refetchAll } =
    useDashboardMetrics(params);

  const chartData = trends ?? [];
  const limit = params.limit ?? 25;

  const podEfficiencyRows = useMemo(() => efficiency.slice(0, limit), [efficiency, limit]);

  const nodeErrorMessage =
    nodesError instanceof Error ? nodesError.message : typeof nodesError === "string" ? nodesError : undefined;
  const podErrorMessage =
    podsError instanceof Error ? podsError.message : typeof podsError === "string" ? podsError : undefined;

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader onRefresh={refetchAll} />

      <MetricsFilterBar params={params} onChange={updateParam} onRefresh={refetchAll} />

      <MetricsSummaryCards summary={summary} isLoading={isLoading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Chart
            title="Node CPU & Memory Usage"
            subtitle="Cluster signals across the selected window"
            metrics={chartData}
            series={NODE_SERIES}
            isLoading={isLoading}
            error={nodeErrorMessage}
            getXAxisLabel={(point: Record<string, unknown>) => {
              const timestamp = (point.timestamp as string | undefined) ?? (point.time as string | undefined);
              return timestamp ? new Date(timestamp).toLocaleString() : "";
            }}
          />
        </div>
        <div className="lg:col-span-5">
          <Table
            title="Pod Efficiency"
            subtitle="Top workloads by efficiency score"
            data={podEfficiencyRows}
            columns={POD_COLUMNS}
            isLoading={isLoading}
            error={podErrorMessage}
            rowKey={(row) => row.id}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Table
            title="Node Inventory"
            subtitle="Resource utilization across nodes"
            data={nodesSummary}
            columns={NODE_COLUMNS}
            isLoading={isLoading}
            error={nodeErrorMessage}
            rowKey={(row) => row.id}
          />
        </div>
        <div className="lg:col-span-5">
          <CostEfficiencyCard efficiency={efficiency} isLoading={isLoading} />
        </div>
      </div>

      <SystemStatus />
    </div>
  );
};
