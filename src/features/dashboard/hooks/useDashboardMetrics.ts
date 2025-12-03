import { useMemo } from "react";
import { metricApi } from "@/shared/api";
import { useFetch } from "@/shared/hooks/useFetch";
import { average, sum } from "@/shared/utils/format";
import { buildMetricsQueryKey } from "@/features/metrics/lib/transformers";
import type {
  EfficiencyMetric,
  MetricsQueryOptions,
  SummaryMetric,
  MetricRawEfficiencyResponse,
  MetricRawSummaryResponse,
  MetricCostSummaryResponse,
  MetricCostTrendResponse,
  MetricCostSummary,
} from "@/types/metrics";
import { useNodesMetrics, usePodsEfficiency } from "./useMetrics";

interface DashboardNodesSummary {
  data: SummaryMetric[];
  usage?: MetricRawSummaryResponse["summary"];
  efficiency?: MetricRawEfficiencyResponse["efficiency"];
  totalCost: number;
}

interface DashboardPodsSummary {
  data: SummaryMetric[];
  efficiency: number;
  cost: number;
}

interface DashboardCostSummary {
  summary: MetricCostSummary;
  start?: string;
  end?: string;
}

export interface DashboardSummary {
  nodes: DashboardNodesSummary;
  pods: DashboardPodsSummary;
  cost?: DashboardCostSummary;
}

export interface UseDashboardMetricsResult {
  summary: DashboardSummary;
  trends: Array<Record<string, unknown>>;
  efficiency: EfficiencyMetric[];
  nodesSummary: SummaryMetric[];
  podsSummary: SummaryMetric[];
  isLoading: boolean;
  error: unknown;
  nodesError: unknown;
  podsError: unknown;
  refetchAll: () => void;
}

const EMPTY_EFFICIENCY: EfficiencyMetric[] = [];
const EMPTY_NODES_SUMMARY: SummaryMetric[] = [];
const EMPTY_PODS_SUMMARY: SummaryMetric[] = [];

const serializeParams = (params?: MetricsQueryOptions) =>
  JSON.stringify(params ?? {});

const extractPayload = <T,>(response?: {
  is_successful?: boolean;
  data?: T;
}) => (response?.is_successful ? response.data : undefined);

export const useDashboardMetrics = (params: MetricsQueryOptions): UseDashboardMetricsResult => {
  const serializedParams = useMemo(() => serializeParams(params), [params]);

  const nodes = useNodesMetrics(params);
  const pods = usePodsEfficiency({ ...params, sort: params.sort ?? "efficiencyScore:desc" });

  const nodesUsageQuery = useFetch(
    buildMetricsQueryKey("nodes", "raw-summary", params),
    () => metricApi.fetchNodesRawSummary(params),
    { deps: [serializedParams] }
  );

  const nodesEfficiencyQuery = useFetch(
    buildMetricsQueryKey("nodes", "raw-efficiency", params),
    () => metricApi.fetchNodesRawEfficiency(params),
    { deps: [serializedParams] }
  );

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

  const efficiency = pods.data?.efficiency ?? EMPTY_EFFICIENCY;
  const nodesSummary = nodes.data?.summary ?? EMPTY_NODES_SUMMARY;
  const podsSummary = pods.data?.summary ?? EMPTY_PODS_SUMMARY;
  const nodesUsage = extractPayload<MetricRawSummaryResponse>(nodesUsageQuery.data)?.summary;
  const nodeEfficiency = extractPayload<MetricRawEfficiencyResponse>(nodesEfficiencyQuery.data)?.efficiency;
  const clusterCostSummary = extractPayload<MetricCostSummaryResponse>(clusterCostSummaryQuery.data);
  const clusterCostTrend = extractPayload<MetricCostTrendResponse>(clusterCostTrendQuery.data);
  const totalClusterCost = clusterCostSummary?.summary.total_cost_usd ?? 0;
  const costTrendPoints = useMemo(
    () => (clusterCostTrend?.points ?? []).map((point) => ({ ...point }) as Record<string, unknown>),
    [clusterCostTrend]
  );

  const summary = useMemo<DashboardSummary>(() => {
    const podEfficiency = efficiency.length ? average(efficiency.map((item) => item.efficiencyScore)) : 0;
    const podCost = sum(podsSummary.map((item) => item.totalCost));

    return {
      nodes: {
        data: nodesSummary,
        usage: nodesUsage,
        efficiency: nodeEfficiency,
        totalCost: totalClusterCost,
      },
      pods: {
        data: podsSummary,
        efficiency: podEfficiency,
        cost: podCost,
      },
      cost: clusterCostSummary
        ? {
            summary: clusterCostSummary.summary,
            start: clusterCostSummary.start,
            end: clusterCostSummary.end,
          }
        : undefined,
    };
  }, [
    clusterCostSummary?.end,
    clusterCostSummary?.start,
    clusterCostSummary?.summary,
    efficiency,
    nodeEfficiency,
    nodesSummary,
    nodesUsage,
    podsSummary,
    totalClusterCost,
  ]);

  const nodesError = nodes.error ?? nodesUsageQuery.error ?? nodesEfficiencyQuery.error;
  const podsError = pods.error;
  const costError = clusterCostSummaryQuery.error ?? clusterCostTrendQuery.error;

  return {
    summary,
    trends: costTrendPoints,
    efficiency,
    nodesSummary,
    podsSummary,
    isLoading:
      nodes.isLoading ||
      pods.isLoading ||
      nodesUsageQuery.isLoading ||
      nodesEfficiencyQuery.isLoading ||
      clusterCostSummaryQuery.isLoading ||
      clusterCostTrendQuery.isLoading,
    error: nodesError ?? podsError ?? costError,
    nodesError: nodesError ?? costError,
    podsError,
    refetchAll: () => {
      void nodes.refetch();
      void pods.refetch();
      void nodesUsageQuery.refetch();
      void nodesEfficiencyQuery.refetch();
      void clusterCostSummaryQuery.refetch();
      void clusterCostTrendQuery.refetch();
    },
  };
};
