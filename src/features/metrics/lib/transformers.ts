import type {
  MetricGetResponse,
  MetricSeries,
} from "@/shared/api/metric";
import type {
  EfficiencyMetric,
  MetricsQueryOptions,
  SummaryMetric,
  TrendMetricPoint,
} from "@/features/metrics/types";

const getLatestPoint = (series: MetricSeries) =>
  series.points[series.points.length - 1];

const toSummaryMetric = (series: MetricSeries): SummaryMetric => {
  const latest = getLatestPoint(series);
  const cpuUsage = latest?.cpu_memory?.cpu_usage_nano_cores ?? 0;
  const memoryUsage = latest?.cpu_memory?.memory_usage_bytes ?? 0;

  return {
    id: series.key,
    name: series.name ?? series.key,
    cpuUsage,
    memoryUsage,
    storageUsage: latest?.storage?.ephemeral?.used_bytes,
    networkIn: latest?.network?.rx_bytes,
    networkOut: latest?.network?.tx_bytes,
    totalCost: latest?.cost?.total_cost_usd,
  };
};

export const toSummaryMetrics = (
  response?: MetricGetResponse
): SummaryMetric[] => {
  if (!response?.series?.length) {
    return [];
  }

  return response.series.map(toSummaryMetric);
};

export const toTrendMetrics = (
  response?: MetricGetResponse
): TrendMetricPoint[] => {
  if (!response?.series?.length) {
    return [];
  }

  const primary = response.series[0];
  return primary.points.map((point) => ({
    timestamp: point.time,
    cpuUsage: point.cpu_memory?.cpu_usage_nano_cores ?? 0,
    memoryUsage: point.cpu_memory?.memory_usage_bytes ?? 0,
    cost: point.cost?.total_cost_usd ?? 0,
  }));
};

const computeEfficiencyScore = (metric: SummaryMetric) => {
  const total = metric.cpuUsage + metric.memoryUsage;
  if (!total) {
    return 0;
  }
  return Math.min(Math.round((metric.cpuUsage / total) * 100), 100);
};

export const toEfficiencyMetrics = (
  response?: MetricGetResponse
): EfficiencyMetric[] => {
  const summary = toSummaryMetrics(response);
  return summary.map((metric) => ({
    id: metric.id,
    name: metric.name,
    efficiencyScore: computeEfficiencyScore(metric),
    cpuEfficiency: metric.cpuUsage,
    memoryEfficiency: metric.memoryUsage,
    costEfficiency: metric.totalCost,
  }));
};

const normalizeParams = (params?: MetricsQueryOptions) => {
  if (!params) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined)
  );
};

export const buildMetricsQueryKey = (
  resource: string,
  series: string,
  params?: MetricsQueryOptions
) =>
  JSON.stringify({
    scope: "metrics",
    resource,
    series,
    params: normalizeParams(params),
  });

