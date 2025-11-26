import ReactECharts from "echarts-for-react";
import { useMetricChartOptions, type ChartSeries } from "@/shared/hooks/useMetricChartOptions";
import { Card } from "./Card";

export type { ChartSeries };

interface ChartProps<T extends Record<string, unknown>> {
  title: string;
  subtitle?: string;
  metrics?: T[];
  series: ChartSeries<T>[];
  height?: number;
  isLoading?: boolean;
  error?: string;
  className?: string;
  getXAxisLabel?: (point: T, index: number) => string;
}

export const Chart = <T extends Record<string, unknown>>({
  title,
  subtitle,
  metrics = [],
  series,
  height = 320,
  isLoading = false,
  error,
  className = "",
  getXAxisLabel,
}: ChartProps<T>) => {
  const options = useMetricChartOptions(metrics, series, getXAxisLabel);

  return (
    <Card title={title} subtitle={subtitle} className={className} isLoading={isLoading}>
      {error ? (
        <div className="flex h-64 items-center justify-center text-sm text-red-500">{error}</div>
      ) : (
        <div className="h-64" style={{ height }}>
          <ReactECharts option={options} style={{ width: "100%", height: "100%" }} opts={{ renderer: "svg" }} />
        </div>
      )}
    </Card>
  );
};
