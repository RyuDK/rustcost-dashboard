import {
  METRICS_BASE,
  encode,
  metricGet,
  type MetricRangeQueryParams,
} from "@/shared/api/base";
import type {
  NodeMetricTargetParams,
  MetricGetResponse,
  MetricRawSummaryResponse,
  MetricRawEfficiencyResponse,
  MetricCostSummaryResponse,
  MetricCostTrendResponse,
} from "@/shared/api/metric/types";

const BASE_URL = `${METRICS_BASE}/nodes`;

export const fetchNodesRaw = (params?: MetricRangeQueryParams) =>
  metricGet<MetricGetResponse>(`${BASE_URL}/raw`, params);

export const fetchNodeRaw = (
  target: NodeMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricGetResponse>(
    `${BASE_URL}/${encode(target.nodeName)}/raw`,
    params
  );

export const fetchNodesRawSummary = (params?: MetricRangeQueryParams) =>
  metricGet<MetricRawSummaryResponse>(`${BASE_URL}/raw/summary`, params);

export const fetchNodeRawSummary = (
  target: NodeMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricRawSummaryResponse>(
    `${BASE_URL}/${encode(target.nodeName)}/raw/summary`,
    params
  );

export const fetchNodesRawEfficiency = (params?: MetricRangeQueryParams) =>
  metricGet<MetricRawEfficiencyResponse>(
    `${BASE_URL}/raw/efficiency`,
    params
  );

export const fetchNodeRawEfficiency = (
  target: NodeMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricRawEfficiencyResponse>(
    `${BASE_URL}/${encode(target.nodeName)}/raw/efficiency`,
    params
  );

export const fetchNodesCost = (params?: MetricRangeQueryParams) =>
  metricGet<MetricGetResponse>(`${BASE_URL}/cost`, params);

export const fetchNodeCost = (
  target: NodeMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricGetResponse>(
    `${BASE_URL}/${encode(target.nodeName)}/cost`,
    params
  );

export const fetchNodesCostSummary = (params?: MetricRangeQueryParams) =>
  metricGet<MetricCostSummaryResponse>(`${BASE_URL}/cost/summary`, params);

export const fetchNodeCostSummary = (
  target: NodeMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricCostSummaryResponse>(
    `${BASE_URL}/${encode(target.nodeName)}/cost/summary`,
    params
  );

export const fetchNodesCostTrend = (params?: MetricRangeQueryParams) =>
  metricGet<MetricCostTrendResponse>(`${BASE_URL}/cost/trend`, params);

export const fetchNodeCostTrend = (
  target: NodeMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricCostTrendResponse>(
    `${BASE_URL}/${encode(target.nodeName)}/cost/trend`,
    params
  );

