import { METRICS_BASE, metricGet } from "@/shared/api/base";
import { withAutoGranularity } from "@/shared/utils/metrics";
import type { MetricRangeQueryParams } from "@/types/api";
import type {
  MetricGetResponse,
  MetricRawSummaryResponse,
  MetricRawEfficiencyResponse,
  MetricCostSummaryResponse,
  MetricCostTrendResponse,
} from "@/types/metrics";

const BASE_URL = `${METRICS_BASE}/cluster`;

export const fetchClusterRaw = (params?: MetricRangeQueryParams) =>
  metricGet<MetricGetResponse>(`${BASE_URL}/raw`, params);

export const fetchClusterRawSummary = (params?: MetricRangeQueryParams) =>
  metricGet<MetricRawSummaryResponse>(`${BASE_URL}/raw/summary`, params);

export const fetchClusterRawEfficiency = (params?: MetricRangeQueryParams) =>
  metricGet<MetricRawEfficiencyResponse>(
    `${BASE_URL}/raw/efficiency`,
    withAutoGranularity(params)
  );

export const fetchClusterCost = (params?: MetricRangeQueryParams) =>
  metricGet<MetricGetResponse>(`${BASE_URL}/cost`, params);

export const fetchClusterCostSummary = (params?: MetricRangeQueryParams) =>
  metricGet<MetricCostSummaryResponse>(`${BASE_URL}/cost/summary`, params);

export const fetchClusterCostTrend = (params?: MetricRangeQueryParams) =>
  metricGet<MetricCostTrendResponse>(`${BASE_URL}/cost/trend`, params);
