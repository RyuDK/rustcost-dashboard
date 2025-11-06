import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useMemo } from "react";
import type { TrendMetricPoint } from "../model/types";
import { LoadingSpinner } from "../../../shared/components/LoadingSpinner";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

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
  const labels = useMemo(
    () => metrics?.map((point) => new Date(point.timestamp).toLocaleTimeString()) ?? [],
    [metrics]
  );

  const data = useMemo(() => {
    if (!metrics) {
      return null;
    }

    return {
      labels,
      datasets: series.map((item) => ({
        label: item.label,
        data: metrics.map((point) => point[item.key] ?? 0),
        borderColor: item.color,
        backgroundColor: `${item.color}33`,
        tension: 0.3,
        fill: true,
        pointRadius: 0,
      })),
    };
  }, [labels, metrics, series]);

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
        {isLoading && <LoadingSpinner label="Loading metrics" className="h-full" />}
        {error && (
          <div className="flex h-full items-center justify-center text-sm text-red-500">
            {error}
          </div>
        )}
        {!isLoading && !error && data && (
          <Line
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  labels: {
                    color: "#fcd34d",
                  },
                },
              },
              scales: {
                x: {
                  ticks: { color: "#9ca3af" },
                  grid: { color: "rgba(148, 163, 184, 0.15)" },
                },
                y: {
                  ticks: { color: "#9ca3af" },
                  grid: { color: "rgba(148, 163, 184, 0.15)" },
                },
              },
            }}
          />
        )}
      </div>
    </div>
  );
};
