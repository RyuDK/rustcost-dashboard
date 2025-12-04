import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import ReactECharts from "echarts-for-react";
import { LoadingSpinner } from "./LoadingSpinner";
import type { TrendMetricPoint } from "@/types/metrics";

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

const BASE_METRIC_CHART_STYLES = {
  container:
    "rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900",
  header: "flex items-center justify-between pb-4",
  title: "text-base font-semibold text-gray-800 dark:text-gray-100",
  body: "h-64",
  error: "flex h-full items-center justify-center text-sm text-red-500",
};

export const MetricChart = ({
  title,
  metrics,
  series,
  isLoading = false,
  error,
  className = "",
}: MetricChartProps) => {
  const safeMetrics = Array.isArray(metrics) ? metrics : [];

  const labels = useMemo(
    () => safeMetrics.map((p) => new Date(p.time).toLocaleDateString()),
    [safeMetrics]
  );

  const echartsOption = useMemo(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { textStyle: { color: "#fcd34d" } },
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
        splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.15)" } },
      },
      series: series.map((item) => ({
        name: item.label,
        type: "line",
        data: safeMetrics.map((m) => m[item.key] ?? 0),
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color: item.color },
        areaStyle: { color: `${item.color}33` },
      })),
    }),
    [labels, safeMetrics, series]
  );

  return (
    <div className={twMerge(BASE_METRIC_CHART_STYLES.container, className)}>
      <div className={BASE_METRIC_CHART_STYLES.header}>
        <h3 className={BASE_METRIC_CHART_STYLES.title}>{title}</h3>
      </div>

      <div className={BASE_METRIC_CHART_STYLES.body}>
        {isLoading && (
          <LoadingSpinner label="Loading metrics" className="h-full" />
        )}

        {error && <div className={BASE_METRIC_CHART_STYLES.error}>{error}</div>}

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
