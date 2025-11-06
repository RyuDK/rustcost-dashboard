import { useFetch, type UseFetchOptions } from "../../../../shared/hooks/useFetch";
import { composeMetricsQueryKey, createMetricsResourceClient } from "../client";
import type {
  CostMetricPoint,
  EfficiencyMetric,
  MetricsQueryOptions,
  MetricsResponse,
  SummaryMetric,
  TrendMetricPoint,
} from "../../model/types";

const client = createMetricsResourceClient("cluster");

const withDeps = (
  params: MetricsQueryOptions | undefined,
  options?: UseFetchOptions
): UseFetchOptions => ({
  ...options,
  deps: [JSON.stringify(params ?? {}), ...(options?.deps ?? [])],
});

/**
 * Fetches aggregate cluster cost metrics.
 */
export const fetchClusterCostMetrics = (params?: MetricsQueryOptions) =>
  client.cost(params);

/**
 * Fetches cluster-wide summary metrics.
 */
export const fetchClusterSummaryMetrics = (params?: MetricsQueryOptions) =>
  client.summary(params);

/**
 * Fetches cluster trend metrics.
 */
export const fetchClusterTrendMetrics = (params?: MetricsQueryOptions) =>
  client.trends(params);

/**
 * Fetches cluster efficiency metrics.
 */
export const fetchClusterEfficiencyMetrics = (params?: MetricsQueryOptions) =>
  client.efficiency(params);

/**
 * React hook that provides cached cluster cost metrics.
 */
export const useClusterCostMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<CostMetricPoint>>(
    composeMetricsQueryKey("cluster", "cost", params),
    () => fetchClusterCostMetrics(params),
    withDeps(params, options)
  );

/**
 * React hook that provides cached cluster summary metrics.
 */
export const useClusterSummaryMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<SummaryMetric>>(
    composeMetricsQueryKey("cluster", "summary", params),
    () => fetchClusterSummaryMetrics(params),
    withDeps(params, options)
  );

/**
 * React hook that provides cached cluster trend metrics.
 */
export const useClusterTrendMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<TrendMetricPoint>>(
    composeMetricsQueryKey("cluster", "trends", params),
    () => fetchClusterTrendMetrics(params),
    withDeps(params, options)
  );

/**
 * React hook that provides cached cluster efficiency metrics.
 */
export const useClusterEfficiencyMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<EfficiencyMetric>>(
    composeMetricsQueryKey("cluster", "efficiency", params),
    () => fetchClusterEfficiencyMetrics(params),
    withDeps(params, options)
  );
