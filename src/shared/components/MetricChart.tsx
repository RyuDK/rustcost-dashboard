import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { LoadingSpinner } from "./LoadingSpinner";
import type { TrendMetricPoint } from "../../features/metrics/types";

export interface MetricChartSeries {
  key: keyof TrendMetricPoint;
  label: string;
  color: string;
}

interface MetricChartProps {
  title: string;
  metrics?: TrendMetricPoint[];
  series: MetricChartSeries[];
  isLoading?: boolean;
  error?: string;
  className?: string;
}

export const MetricChart = ({
  title,
  metrics,
  series,
  isLoading,
  error,
  className = "",
}: MetricChartProps) => {
  const safeMetrics = Array.isArray(metrics) ? metrics : [];

  const labels = useMemo(
    () => safeMetrics.map((p) => new Date(p.time).toLocaleDateString()),
    [safeMetrics]
  );

  const echartsOption = useMemo(() => {
    return {
      tooltip: {
        trigger: "axis",
      },
      legend: {
        textStyle: { color: "#fcd34d" },
      },
      grid: {
        left: "3%",
        right: "3%",
        bottom: "3%",
        top: "10%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: { color: "#9ca3af" },
        axisLine: { lineStyle: { color: "#9ca3af" } },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "#9ca3af" },
        axisLine: { show: false },
        splitLine: {
          lineStyle: { color: "rgba(148, 163, 184, 0.15)" },
        },
      },
      series: series.map((item) => ({
        name: item.label,
        type: "line",
        data: safeMetrics.map((m) => m[item.key] ?? 0),
        smooth: true,
        symbol: "none",
        lineStyle: {
          width: 2,
          color: item.color,
        },
        areaStyle: {
          color: `${item.color}33`, // same transparency style you had
        },
      })),
    };
  }, [labels, safeMetrics, series]);

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <div className="flex items-center justify-between pb-4">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
          {title}
        </h3>
      </div>

      <div className="h-64">
        {isLoading && (
          <LoadingSpinner label="Loading metrics" className="h-full" />
        )}

        {error && (
          <div className="flex h-full items-center justify-center text-sm text-red-500">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <ReactECharts
            option={echartsOption}
            style={{ width: "100%", height: "100%" }}
            opts={{ renderer: "svg" }}
          />
        )}
      </div>
    </div>
  );
};
