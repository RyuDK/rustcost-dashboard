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

const client = createMetricsResourceClient("namespaces");

const withDeps = (
  params: MetricsQueryOptions | undefined,
  options?: UseFetchOptions
): UseFetchOptions => ({
  ...options,
  deps: [JSON.stringify(params ?? {}), ...(options?.deps ?? [])],
});

/**
 * Fetches cost metrics aggregated by namespace.
 */
export const fetchNamespaceCostMetrics = (params?: MetricsQueryOptions) =>
  client.cost(params);

/**
 * Fetches summary metrics for namespaces.
 */
export const fetchNamespaceSummaryMetrics = (params?: MetricsQueryOptions) =>
  client.summary(params);

/**
 * Fetches trend data for namespaces.
 */
export const fetchNamespaceTrendMetrics = (params?: MetricsQueryOptions) =>
  client.trends(params);

/**
 * Fetches efficiency metrics for namespaces.
 */
export const fetchNamespaceEfficiencyMetrics = (
  params?: MetricsQueryOptions
) => client.efficiency(params);

/**
 * React hook that provides cached cost metrics for namespaces.
 */
export const useNamespaceCostMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<CostMetricPoint>>(
    composeMetricsQueryKey("namespaces", "cost", params),
    () => fetchNamespaceCostMetrics(params),
    withDeps(params, options)
  );

/**
 * React hook that provides cached summary metrics for namespaces.
 */
export const useNamespaceSummaryMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<SummaryMetric>>(
    composeMetricsQueryKey("namespaces", "summary", params),
    () => fetchNamespaceSummaryMetrics(params),
    withDeps(params, options)
  );

/**
 * React hook that provides cached trend metrics for namespaces.
 */
export const useNamespaceTrendMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<TrendMetricPoint>>(
    composeMetricsQueryKey("namespaces", "trends", params),
    () => fetchNamespaceTrendMetrics(params),
    withDeps(params, options)
  );

/**
 * React hook that provides cached efficiency metrics for namespaces.
 */
export const useNamespaceEfficiencyMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<EfficiencyMetric>>(
    composeMetricsQueryKey("namespaces", "efficiency", params),
    () => fetchNamespaceEfficiencyMetrics(params),
    withDeps(params, options)
  );
