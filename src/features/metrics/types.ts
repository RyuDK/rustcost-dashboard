import type { MetricRangeQueryParams } from "../../shared/api/base";

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
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  cost?: number;
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
