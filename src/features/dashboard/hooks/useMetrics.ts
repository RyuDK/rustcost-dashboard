import { useCallback, useMemo } from "react";
import { metricApi } from "@/shared/api";
import type { MetricsQueryOptions } from "@/features/metrics/types";
import {
  buildMetricsQueryKey,
  toEfficiencyMetrics,
  toSummaryMetrics,
  toTrendMetrics,
} from "@/features/metrics/lib/transformers";
import { getDefaultDateRange } from "@/shared/utils/date";
import { DEFAULT_PAGE_SIZE } from "@/shared/api/constants";
import { useFetch } from "@/shared/hooks/useFetch";

const serializeParams = (params?: MetricsQueryOptions) =>
  JSON.stringify(params ?? {});

const extractPayload = <T,>(response?: { is_successful?: boolean; data?: T }) =>
  response?.is_successful ? response.data : undefined;

export const createDefaultMetricsParams = (): MetricsQueryOptions => {
  const { start, end } = getDefaultDateRange();
  return {
    start,
    end,
    limit: DEFAULT_PAGE_SIZE,
    sort: "cpu_usage_nano_cores:desc",
    metric: ["cpu_usage", "memory_usage"],
  };
};

export const useNodesMetrics = (params: MetricsQueryOptions) => {
  const query = useFetch(
    buildMetricsQueryKey("nodes", "raw", params),
    () => metricApi.fetchNodesRaw(params),
    { deps: [serializeParams(params)] }
  );

  const payload = extractPayload(query.data);

  const data = useMemo(
    () => ({
      summary: toSummaryMetrics(payload),
      trends: toTrendMetrics(payload),
    }),
    [payload]
  );

  return {
    data,
    isLoading: query.isLoading,
    error: query.error ?? (!query.data?.is_successful ? query.data?.error_msg : undefined),
    refetch: query.refetch,
  };
};

export const usePodsEfficiency = (params: MetricsQueryOptions) => {
  const query = useFetch(
    buildMetricsQueryKey("pods", "raw", params),
    () => metricApi.fetchPodsRaw(params),
    { deps: [serializeParams(params)] }
  );

  const payload = extractPayload(query.data);
  const summary = useMemo(() => toSummaryMetrics(payload), [payload]);
  const efficiency = useMemo(() => toEfficiencyMetrics(payload), [payload]);

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    data: { efficiency, summary },
    isLoading: query.isLoading,
    error: query.error ?? (!query.data?.is_successful ? query.data?.error_msg : undefined),
    refetch,
  };
};
