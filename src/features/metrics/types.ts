import type { MetricRangeQueryParams } from "@/shared/api/base";

export interface SummaryMetric {
  id: string;
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  storageUsage?: number;
  networkIn?: number;
  networkOut?: number;
  totalCost?: number;
}

export interface TrendMetricPoint {
  time: string;
  total_cost_usd: number;
  cpu_cost_usd: number;
  memory_cost_usd: number;
  storage_cost_usd: number;
}

export interface EfficiencyMetric {
  id: string;
  name: string;
  efficiencyScore: number;
  cpuEfficiency?: number;
  memoryEfficiency?: number;
  costEfficiency?: number;
  potentialSavings?: number;
}

export type MetricsQueryOptions = MetricRangeQueryParams;
