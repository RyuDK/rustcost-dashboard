import { useMemo } from "react";
import { metricApi } from "@/shared/api";
import { useFetch } from "@/shared/hooks/useFetch";
import { buildMetricsQueryKey } from "@/features/metrics/lib/transformers";
import type {
  MetricsQueryOptions,
  MetricCostSummaryResponse,
  MetricCostTrendResponse,
  MetricCostSummary,
} from "@/types/metrics";

interface DashboardCostSummary {
  summary: MetricCostSummary;
  start?: string;
  end?: string;
}

export interface DashboardSummary {
  cost?: DashboardCostSummary;
}

export interface UseDashboardMetricsResult {
  summary: DashboardSummary;
  trends: Array<Record<string, unknown>>;
  isLoading: boolean;
  error: unknown;
  refetchAll: () => void;
}

const serializeParams = (params?: MetricsQueryOptions) =>
  JSON.stringify(params ?? {});

const extractPayload = <T,>(response?: {
  is_successful?: boolean;
  data?: T;
}) => (response?.is_successful ? response.data : undefined);

export const useDashboardMetrics = (params: MetricsQueryOptions): UseDashboardMetricsResult => {
  const serializedParams = useMemo(() => serializeParams(params), [params]);

  const clusterCostSummaryQuery = useFetch(
    buildMetricsQueryKey("cluster", "cost-summary", params),
    () => metricApi.fetchClusterCostSummary(params),
    { deps: [serializedParams] }
  );

  const clusterCostTrendQuery = useFetch(
    buildMetricsQueryKey("cluster", "cost-trend", params),
    () => metricApi.fetchClusterCostTrend(params),
    { deps: [serializedParams] }
  );

  const clusterCostSummary = extractPayload<MetricCostSummaryResponse>(clusterCostSummaryQuery.data);
  const clusterCostTrend = extractPayload<MetricCostTrendResponse>(clusterCostTrendQuery.data);
  const costTrendPoints = useMemo(
    () => (clusterCostTrend?.points ?? []).map((point) => ({ ...point }) as Record<string, unknown>),
    [clusterCostTrend]
  );

  const summary = useMemo<DashboardSummary>(() => {
    return {
      cost: clusterCostSummary
        ? {
            summary: clusterCostSummary.summary,
            start: clusterCostSummary.start,
            end: clusterCostSummary.end,
          }
        : undefined,
    };
  }, [clusterCostSummary]);

  const costError = clusterCostSummaryQuery.error ?? clusterCostTrendQuery.error;

  return {
    summary,
    trends: costTrendPoints,
    isLoading:
      clusterCostSummaryQuery.isLoading ||
      clusterCostTrendQuery.isLoading,
    error: costError,
    refetchAll: () => {
      void clusterCostSummaryQuery.refetch();
      void clusterCostTrendQuery.refetch();
    },
  };
};
