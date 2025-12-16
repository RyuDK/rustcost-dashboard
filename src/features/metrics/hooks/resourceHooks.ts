/* eslint-disable @typescript-eslint/no-explicit-any */
import { metricApi } from "@/shared/api";
import { useFetch } from "@/shared/hooks/useFetch";
import type { ApiResponse } from "@/types/api";
import type { UseFetchResult } from "@/types/fetch";
import type {
  MetricCostTrendResponse,
  MetricGetResponse,
  MetricRawEfficiencyResponse,
  MetricsQueryOptions,
} from "@/types/metrics";
import { buildMetricsQueryKey, toEfficiencyMetrics } from "@/features/metrics/lib/transformers";
import { withAutoGranularity } from "@/shared/utils/metrics";

const serializeParams = (params?: MetricsQueryOptions) =>
  JSON.stringify(params ?? {});

const extractPayload = <T>(response?: ApiResponse<T>) =>
  response?.is_successful ? response.data : undefined;

export const mapToTrendResult = <T>(
  query: UseFetchResult<ApiResponse<T>>,
  mapper: (payload: T | undefined) => any = (payload) => payload
) => {
  const payload = extractPayload(query.data);

  return {
    data: mapper(payload),
    isLoading: query.isLoading,
    error:
      query.error ??
      (!query.data?.is_successful ? query.data?.error_msg : undefined),
    refetch: query.refetch,
  };
};

const mapToEfficiencyResult = (
  query: UseFetchResult<ApiResponse<MetricGetResponse>>
) => {
  const payload = extractPayload(query.data);
  return {
    data: toEfficiencyMetrics(payload),
    isLoading: query.isLoading,
    error:
      query.error ??
      (!query.data?.is_successful ? query.data?.error_msg : undefined),
    refetch: query.refetch,
  };
};

export const useClusterTrendMetrics = (params: MetricsQueryOptions) => {
  const query = useFetch<ApiResponse<MetricCostTrendResponse>>(
    buildMetricsQueryKey("cluster", "costTrend", params),
    () => metricApi.fetchClusterCostTrend(params),
    { deps: [serializeParams(params)] }
  );

  return mapToTrendResult(query, (payload) => ({
    trend: payload?.trend,
    points: payload?.points ?? [],
  }));
};

export const useNamespaceTrendMetrics = (params: MetricsQueryOptions) => {
  const query = useFetch<ApiResponse<MetricGetResponse>>(
    buildMetricsQueryKey("namespaces", "raw", params),
    () => metricApi.fetchNamespacesRaw(params),
    { deps: [serializeParams(params)] }
  );
  return mapToTrendResult(query);
};

export const useNamespaceEfficiencyMetrics = (params: MetricsQueryOptions) => {
  const query = useFetch<ApiResponse<MetricGetResponse>>(
    buildMetricsQueryKey("namespaces", "raw", params),
    () => metricApi.fetchNamespacesRaw(params),
    { deps: [serializeParams(params)] }
  );
  return mapToEfficiencyResult(query);
};

export const useDeploymentEfficiencyMetrics = (params: MetricsQueryOptions) => {
  const query = useFetch<ApiResponse<MetricGetResponse>>(
    buildMetricsQueryKey("deployments", "raw", params),
    () => metricApi.fetchDeploymentsRaw(params),
    { deps: [serializeParams(params)] }
  );
  return mapToEfficiencyResult(query);
};

export const useNodeEfficiencyMetrics = (params: MetricsQueryOptions) => {
  const normalizedParams = withAutoGranularity(params) ?? params;
  const query = useFetch<ApiResponse<MetricRawEfficiencyResponse>>(
    buildMetricsQueryKey("nodes", "rawEfficiency", normalizedParams),
    () => metricApi.fetchNodesRawEfficiency(normalizedParams),
    { deps: [serializeParams(normalizedParams)] }
  );

  const payload = extractPayload(query.data);
  const efficiency = payload?.efficiency;

  return {
    data: efficiency
      ? {
          ...efficiency,
          start: payload?.start,
          end: payload?.end,
          granularity: payload?.granularity,
        }
      : undefined,
    isLoading: query.isLoading,
    error:
      query.error ??
      (!query.data?.is_successful ? query.data?.error_msg : undefined),
    refetch: query.refetch,
  };
};
