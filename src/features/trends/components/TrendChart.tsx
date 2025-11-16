import type { TrendMetricPoint } from "../../metrics/types";
import { MetricChart, type MetricChartSeries } from "../../../shared/components/MetricChart";

interface TrendChartProps {
  title: string;
  data?: TrendMetricPoint[];
  isLoading?: boolean;
  error?: string;
  series?: MetricChartSeries[];
}

const defaultSeries: MetricChartSeries[] = [
  { key: "cpuUsage", label: "CPU (mCores)", color: "#f59e0b" },
  { key: "memoryUsage", label: "Memory (Bytes)", color: "#6366f1" },
];

export const TrendChart = ({
  title,
  data,
  isLoading,
  error,
  series = defaultSeries,
}: TrendChartProps) => (
  <MetricChart
    title={title}
    metrics={data}
    series={series}
    isLoading={isLoading}
    error={error}
  />
);
