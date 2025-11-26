import type { TrendMetricPoint } from "@/features/metrics/types";
import {
  MetricChart,
  type MetricChartSeries,
} from "@/shared/components/MetricChart";
import type { MetricCostTrendDto } from "@/shared/api/metric/types";
import { TrendSummary } from "./TrendSummary";

interface TrendChartProps {
  title: string;
  data?: { trend?: MetricCostTrendDto; points: TrendMetricPoint[] };
  isLoading?: boolean;
  error?: string;
  series?: MetricChartSeries[];
}

const defaultSeries: MetricChartSeries[] = [
  { key: "total_cost_usd", label: "Total Cost (USD)", color: "#f59e0b" },
  { key: "cpu_cost_usd", label: "CPU Cost (USD)", color: "#fb923c" },
  { key: "memory_cost_usd", label: "Memory Cost (USD)", color: "#6366f1" },
  { key: "storage_cost_usd", label: "Storage Cost (USD)", color: "#10b981" },
];

export const TrendChart = ({
  title,
  data,
  isLoading,
  error,
  series = defaultSeries,
}: TrendChartProps) => (
  <div className="flex flex-col gap-6">
    {data?.trend && <TrendSummary trend={data.trend} />}

    <MetricChart
      title={title}
      metrics={data?.points}
      series={series}
      isLoading={isLoading}
      error={error}
    />
  </div>
);
