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

const client = createMetricsResourceClient("pods");

const withDeps = (
  params: MetricsQueryOptions | undefined,
  options?: UseFetchOptions
): UseFetchOptions => ({
  ...options,
  deps: [JSON.stringify(params ?? {}), ...(options?.deps ?? [])],
});

/**
 * Fetches cost metrics for pods.
 *
 * @param params - Optional filtering, pagination, and sorting parameters.
 */
export const fetchPodsCostMetrics = (params?: MetricsQueryOptions) =>
  client.cost(params);

/**
 * Fetches summary metrics (CPU, memory, cost) for pods.
 *
 * @param params - Optional filtering, pagination, and sorting parameters.
 */
export const fetchPodsSummaryMetrics = (params?: MetricsQueryOptions) =>
  client.summary(params);

/**
 * Fetches time-series trend metrics for pods.
 *
 * @param params - Optional filtering, pagination, and sorting parameters.
 */
export const fetchPodsTrendMetrics = (params?: MetricsQueryOptions) =>
  client.trends(params);

/**
 * Fetches efficiency metrics for pods.
 *
 * @param params - Optional filtering, pagination, and sorting parameters.
 */
export const fetchPodsEfficiencyMetrics = (params?: MetricsQueryOptions) =>
  client.efficiency(params);

/**
 * React hook that provides cached cost metrics for pods.
 */
export const usePodsCostMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<CostMetricPoint>>(
    composeMetricsQueryKey("pods", "cost", params),
    () => fetchPodsCostMetrics(params),
    withDeps(params, options)
  );

/**
 * React hook that provides cached summary metrics for pods.
 */
export const usePodsSummaryMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<SummaryMetric>>(
    composeMetricsQueryKey("pods", "summary", params),
    () => fetchPodsSummaryMetrics(params),
    withDeps(params, options)
  );

/**
 * React hook that provides cached trend metrics for pods.
 */
export const usePodsTrendMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<TrendMetricPoint>>(
    composeMetricsQueryKey("pods", "trends", params),
    () => fetchPodsTrendMetrics(params),
    withDeps(params, options)
  );

/**
 * React hook that provides cached efficiency metrics for pods.
 */
export const usePodsEfficiencyMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<EfficiencyMetric>>(
    composeMetricsQueryKey("pods", "efficiency", params),
    () => fetchPodsEfficiencyMetrics(params),
    withDeps(params, options)
  );
