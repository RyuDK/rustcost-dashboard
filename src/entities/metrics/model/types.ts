import type { MetricResource } from "../../../shared/api/constants";
import type { MetricsQueryParams } from "../../../shared/api/http";

export type MetricsSeries = "cost" | "summary" | "trends" | "efficiency";

export interface Range {
  start: string;
  end: string;
}

export interface PaginationMeta {
  limit: number;
  offset: number;
  total?: number;
}

export interface MetricsResponse<T> {
  resource: MetricResource;
  series: MetricsSeries;
  range: Range;
  data: T[];
  pagination?: PaginationMeta;
}

export interface MetricIdentifier {
  id: string;
  name: string;
  namespace?: string;
  cluster?: string;
  labels?: Record<string, string>;
}

export interface CostMetricPoint {
  timestamp: string;
  totalCost: number;
  currency: string;
  amortizedCost?: number;
  breakdown?: Record<string, number>;
}

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
  metricTotals?: Record<string, number>;
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

export type MetricsQueryOptions = MetricsQueryParams & {
  currency?: string;
};
