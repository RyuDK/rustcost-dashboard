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

const client = createMetricsResourceClient("nodes");

const withDeps = (
  params: MetricsQueryOptions | undefined,
  options?: UseFetchOptions
): UseFetchOptions => ({
  ...options,
  deps: [JSON.stringify(params ?? {}), ...(options?.deps ?? [])],
});

/**
 * Fetches cost metrics for all cluster nodes.
 *
 * @param params - Optional filtering, pagination, and sorting parameters.
 */
export const fetchNodesCostMetrics = (params?: MetricsQueryOptions) =>
  client.cost(params);

/**
 * Fetches node summary metrics (CPU, memory, cost aggregates).
 *
 * @param params - Optional filtering, pagination, and sorting parameters.
 */
export const fetchNodesSummaryMetrics = (params?: MetricsQueryOptions) =>
  client.summary(params);

/**
 * Fetches time-series trend metrics for nodes.
 *
 * @param params - Optional filtering, pagination, and sorting parameters.
 */
export const fetchNodesTrendMetrics = (params?: MetricsQueryOptions) =>
  client.trends(params);

/**
 * Fetches efficiency scores for nodes.
 *
 * @param params - Optional filtering, pagination, and sorting parameters.
 */
export const fetchNodesEfficiencyMetrics = (params?: MetricsQueryOptions) =>
  client.efficiency(params);

/**
 * React hook that provides cached cost metrics for nodes.
 *
 * @param params - Optional filtering, pagination, and sorting parameters.
 * @param options - Hook configuration such as enabled flag or stale time.
 */
export const useNodesCostMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<CostMetricPoint>>(
    composeMetricsQueryKey("nodes", "cost", params),
    () => fetchNodesCostMetrics(params),
    withDeps(params, options)
  );

/**
 * React hook that provides cached summary metrics for nodes.
 */
export const useNodesSummaryMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<SummaryMetric>>(
    composeMetricsQueryKey("nodes", "summary", params),
    () => fetchNodesSummaryMetrics(params),
    withDeps(params, options)
  );

/**
 * React hook that provides cached trend metrics for nodes.
 */
export const useNodesTrendMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<TrendMetricPoint>>(
    composeMetricsQueryKey("nodes", "trends", params),
    () => fetchNodesTrendMetrics(params),
    withDeps(params, options)
  );

/**
 * React hook that provides cached efficiency metrics for nodes.
 */
export const useNodesEfficiencyMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<EfficiencyMetric>>(
    composeMetricsQueryKey("nodes", "efficiency", params),
    () => fetchNodesEfficiencyMetrics(params),
    withDeps(params, options)
  );
