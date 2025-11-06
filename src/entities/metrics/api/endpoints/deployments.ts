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

const client = createMetricsResourceClient("deployments");

const withDeps = (
  params: MetricsQueryOptions | undefined,
  options?: UseFetchOptions
): UseFetchOptions => ({
  ...options,
  deps: [JSON.stringify(params ?? {}), ...(options?.deps ?? [])],
});

/**
 * Fetches cost metrics for deployments.
 */
export const fetchDeploymentCostMetrics = (params?: MetricsQueryOptions) =>
  client.cost(params);

/**
 * Fetches summary metrics for deployments.
 */
export const fetchDeploymentSummaryMetrics = (params?: MetricsQueryOptions) =>
  client.summary(params);

/**
 * Fetches trend data for deployments.
 */
export const fetchDeploymentTrendMetrics = (params?: MetricsQueryOptions) =>
  client.trends(params);

/**
 * Fetches efficiency metrics for deployments.
 */
export const fetchDeploymentEfficiencyMetrics = (
  params?: MetricsQueryOptions
) => client.efficiency(params);

/**
 * React hook that provides cached cost metrics for deployments.
 */
export const useDeploymentCostMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<CostMetricPoint>>(
    composeMetricsQueryKey("deployments", "cost", params),
    () => fetchDeploymentCostMetrics(params),
    withDeps(params, options)
  );

/**
 * React hook that provides cached summary metrics for deployments.
 */
export const useDeploymentSummaryMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<SummaryMetric>>(
    composeMetricsQueryKey("deployments", "summary", params),
    () => fetchDeploymentSummaryMetrics(params),
    withDeps(params, options)
  );

/**
 * React hook that provides cached trend metrics for deployments.
 */
export const useDeploymentTrendMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<TrendMetricPoint>>(
    composeMetricsQueryKey("deployments", "trends", params),
    () => fetchDeploymentTrendMetrics(params),
    withDeps(params, options)
  );

/**
 * React hook that provides cached efficiency metrics for deployments.
 */
export const useDeploymentEfficiencyMetrics = (
  params?: MetricsQueryOptions,
  options?: UseFetchOptions
) =>
  useFetch<MetricsResponse<EfficiencyMetric>>(
    composeMetricsQueryKey("deployments", "efficiency", params),
    () => fetchDeploymentEfficiencyMetrics(params),
    withDeps(params, options)
  );
