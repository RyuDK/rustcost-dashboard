import { useMemo } from "react";
import type { EChartsOption } from "echarts";

const defaultLabelFormatter = (point: Record<string, unknown>): string => {
  const raw =
    (point.timestamp as string | number | Date | undefined) ??
    (point.time as string | number | Date | undefined) ??
    (point.date as string | number | Date | undefined);

  if (raw === undefined) {
    return "";
  }

  const value =
    raw instanceof Date
      ? raw
      : typeof raw === "number"
      ? new Date(raw)
      : new Date(String(raw));

  if (Number.isNaN(value.getTime())) {
    return String(raw);
  }

  return value.toLocaleString();
};

export interface ChartSeries<T extends Record<string, unknown>> {
  key: keyof T;
  label: string;
  color: string;
  type?: "line" | "bar";
  area?: boolean;
  valueFormatter?: (value: number) => string;
}

const getNumericValue = (value: unknown): number => {
  if (typeof value === "number") {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const useMetricChartOptions = <T extends Record<string, unknown>>(
  metrics: T[],
  series: ChartSeries<T>[],
  getXAxisLabel?: (point: T, index: number) => string
): EChartsOption => {
  const labels = metrics.map((point, index) =>
    getXAxisLabel ? getXAxisLabel(point, index) : defaultLabelFormatter(point)
  );

  return useMemo(
    () => ({
      color: series.map((item) => item.color),
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(15, 23, 42, 0.94)",
        borderWidth: 0,
        textStyle: { color: "#f8fafc" },
      },
      grid: {
        left: "4%",
        right: "4%",
        bottom: "5%",
        top: "14%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: labels,
        axisLine: { lineStyle: { color: "rgba(148, 163, 184, 0.6)" } },
        axisLabel: { color: "rgba(100, 116, 139, 0.9)" },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisLabel: { color: "rgba(100, 116, 139, 0.9)" },
        splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.15)" } },
      },
      series: series.map((definition) => ({
        name: definition.label,
        type: definition.type ?? "line",
        smooth: definition.type !== "bar",
        symbol: "circle",
        showSymbol: false,
        lineStyle: { width: 2, color: definition.color },
        areaStyle: definition.area
          ? {
              color: definition.color,
              opacity: 0.08,
            }
          : undefined,
        emphasis: { focus: "series" },
        data: metrics.map((point) => getNumericValue(point[definition.key])),
        tooltip: definition.valueFormatter
          ? {
              valueFormatter: (value: unknown) =>
                definition.valueFormatter?.(
                  typeof value === "number" ? value : Number(value) || 0
                ),
            }
          : undefined,
      })),
    }),
    [metrics, series, labels]
  );
};
