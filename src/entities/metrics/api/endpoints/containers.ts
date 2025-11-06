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

const client = createMetricsResourceClient("containers");

const withDeps = (
  params: MetricsQueryOptions | undefined,
  options?: UseFetchOptions
): UseFetchOptions => ({
  ...options,
  deps: [JSON.stringify(params ?? {}), ...(options?.deps ?? [])],
});

/**
 * Fetches cost metrics for individual containers.
 *
 * @param params - Optional filtering, pagination, and sorting parameters.
 */
export const fetchContainerCostMetrics = (params?: MetricsQueryOptions) =>
  client.cost(params);

/**
 * Fetches summary metrics (CPU, memory, cost) for containers.
 *
 * @param params - Optional filtering, pagination, and sorting parameters.
 */
export const fetchContainerSummaryMetrics = (params?: MetricsQueryOptions) =>
  client.summary(params);

/**
 * Fetches trend data for containers.
 *
 * @param params - Optional filtering, pagination, and sorting parameters.
 */
export const fetchContainerTrendMetrics = (params?: MetricsQueryOptions) =>
  client.trends(params);

/**
 * Fetches efficiency metrics for containers.
 *
 * @param params - Optional filtering, pagination, and sorting parameters.
 */
export const fetchContainerEfficiencyMetrics = (
  params?: MetricsQueryOptions
) => client.efficiency(params);

/**
 * React hook that provides cached cost metrics for containers.
 */
export const useContainerCostMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<CostMetricPoint>>(
    composeMetricsQueryKey("containers", "cost", params),
    () => fetchContainerCostMetrics(params),
    withDeps(params, options)
  );

/**
 * React hook that provides cached summary metrics for containers.
 */
export const useContainerSummaryMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<SummaryMetric>>(
    composeMetricsQueryKey("containers", "summary", params),
    () => fetchContainerSummaryMetrics(params),
    withDeps(params, options)
  );

/**
 * React hook that provides cached trend metrics for containers.
 */
export const useContainerTrendMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<TrendMetricPoint>>(
    composeMetricsQueryKey("containers", "trends", params),
    () => fetchContainerTrendMetrics(params),
    withDeps(params, options)
  );

/**
 * React hook that provides cached efficiency metrics for containers.
 */
export const useContainerEfficiencyMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<EfficiencyMetric>>(
    composeMetricsQueryKey("containers", "efficiency", params),
    () => fetchContainerEfficiencyMetrics(params),
    withDeps(params, options)
  );
