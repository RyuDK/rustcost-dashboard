import { useMemo } from "react";
import { metricApi } from "@/shared/api";
import { useFetch } from "@/shared/hooks/useFetch";
import { average, sum } from "@/shared/utils/format";
import { buildMetricsQueryKey } from "@/features/metrics/lib/transformers";
import type {
  EfficiencyMetric,
  MetricsQueryOptions,
  SummaryMetric,
  MetricGetResponse,
  MetricRawEfficiencyResponse,
  MetricRawSummaryResponse,
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

export interface DashboardSummary {
  nodes: DashboardNodesSummary;
  pods: DashboardPodsSummary;
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

const calculateTotalCost = (response?: MetricGetResponse): number => {
  if (!response?.series?.length) {
    return 0;
  }

  return response.series.reduce((total, series) => {
    if (!series.points.length) {
      return total;
    }

    const latest = series.points[series.points.length - 1];
    return total + (latest?.cost?.total_cost_usd ?? 0);
  }, 0);
};

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

  const nodesCostQuery = useFetch(
    buildMetricsQueryKey("nodes", "cost", params),
    () => metricApi.fetchNodesCost(params),
    { deps: [serializedParams] }
  );

  const efficiency = pods.data?.efficiency ?? EMPTY_EFFICIENCY;
  const nodesSummary = nodes.data?.summary ?? EMPTY_NODES_SUMMARY;
  const podsSummary = pods.data?.summary ?? EMPTY_PODS_SUMMARY;
  const nodesUsage = extractPayload<MetricRawSummaryResponse>(nodesUsageQuery.data)?.summary;
  const nodeEfficiency = extractPayload<MetricRawEfficiencyResponse>(nodesEfficiencyQuery.data)?.efficiency;
  const nodeCostPayload = extractPayload<MetricGetResponse>(nodesCostQuery.data);
  const nodeTotalCost = useMemo(() => calculateTotalCost(nodeCostPayload), [nodeCostPayload]);

  const summary = useMemo<DashboardSummary>(() => {
    const podEfficiency = efficiency.length ? average(efficiency.map((item) => item.efficiencyScore)) : 0;
    const podCost = sum(podsSummary.map((item) => item.totalCost));

    return {
      nodes: {
        data: nodesSummary,
        usage: nodesUsage,
        efficiency: nodeEfficiency,
        totalCost: nodeTotalCost,
      },
      pods: {
        data: podsSummary,
        efficiency: podEfficiency,
        cost: podCost,
      },
    };
  }, [efficiency, nodeEfficiency, nodeTotalCost, nodesSummary, nodesUsage, podsSummary]);

  const nodesError = nodes.error ?? nodesUsageQuery.error ?? nodesEfficiencyQuery.error ?? nodesCostQuery.error;
  const podsError = pods.error;

  return {
    summary,
    trends: nodes.data?.trends ?? [],
    efficiency,
    nodesSummary,
    podsSummary,
    isLoading:
      nodes.isLoading ||
      pods.isLoading ||
      nodesUsageQuery.isLoading ||
      nodesEfficiencyQuery.isLoading ||
      nodesCostQuery.isLoading,
    error: nodesError ?? podsError,
    nodesError,
    podsError,
    refetchAll: () => {
      void nodes.refetch();
      void pods.refetch();
      void nodesUsageQuery.refetch();
      void nodesEfficiencyQuery.refetch();
      void nodesCostQuery.refetch();
    },
  };
};
