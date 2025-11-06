import { useCallback, useMemo } from "react";
import {
  useNodesSummaryMetrics,
  useNodesTrendMetrics,
} from "../../../entities/metrics/api/endpoints/nodes";
import {
  usePodsEfficiencyMetrics,
  usePodsSummaryMetrics,
} from "../../../entities/metrics/api/endpoints/pods";
import type { MetricsQueryOptions } from "../../../entities/metrics/model/types";
import { getDefaultDateRange } from "../../../shared/lib/dateUtils";
import { DEFAULT_PAGE_SIZE } from "../../../shared/api/constants";

/**
 * Creates default query parameters for dashboard metrics views.
 */
export const createDefaultMetricsParams = (): MetricsQueryOptions => {
  const { start, end } = getDefaultDateRange();
  return {
    start,
    end,
    limit: DEFAULT_PAGE_SIZE,
    sort: "cpuUsage:desc",
    metric: ["cpuUsage", "memoryUsage"],
  };
};

/**
 * Aggregates node summary and trend metrics for the dashboard.
 */
export const useNodesMetrics = (params: MetricsQueryOptions) => {
  const summary = useNodesSummaryMetrics(params);
  const trends = useNodesTrendMetrics(params);

  const data = useMemo(
    () => ({
      summary: summary.data?.data ?? [],
      trends: trends.data?.data ?? [],
    }),
    [summary.data, trends.data]
  );

  const refetch = useCallback(async () => {
    await Promise.all([summary.refetch(), trends.refetch()]);
  }, [summary, trends]);

  return {
    data,
    isLoading: summary.isLoading || trends.isLoading,
    error: summary.error ?? trends.error,
    refetch,
  };
};

/**
 * Aggregates pod efficiency and summary metrics for the dashboard.
 */
export const usePodsEfficiency = (params: MetricsQueryOptions) => {
  const efficiency = usePodsEfficiencyMetrics(params);
  const summary = usePodsSummaryMetrics(params);

  const data = useMemo(
    () => ({
      efficiency: efficiency.data?.data ?? [],
      summary: summary.data?.data ?? [],
    }),
    [efficiency.data, summary.data]
  );

  const refetch = useCallback(async () => {
    await Promise.all([efficiency.refetch(), summary.refetch()]);
  }, [efficiency, summary]);

  return {
    data,
    isLoading: efficiency.isLoading || summary.isLoading,
    error: efficiency.error ?? summary.error,
    refetch,
  };
};
