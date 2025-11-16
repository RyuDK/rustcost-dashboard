import {
  METRICS_BASE,
  encode,
  metricGet,
  type MetricRangeQueryParams,
} from "../../../base";
import type {
  PodMetricTargetParams,
  MetricGetResponse,
  MetricRawSummaryResponse,
  MetricRawEfficiencyResponse,
  MetricCostSummaryResponse,
  MetricCostTrendResponse,
} from "../../types";

const BASE_URL = `${METRICS_BASE}/pods`;

export const fetchPodsRaw = (params?: MetricRangeQueryParams) =>
  metricGet<MetricGetResponse>(`${BASE_URL}/raw`, params);

export const fetchPodRaw = (
  target: PodMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricGetResponse>(
    `${BASE_URL}/${encode(target.podUid)}/raw`,
    params
  );

export const fetchPodsRawSummary = (params?: MetricRangeQueryParams) =>
  metricGet<MetricRawSummaryResponse>(`${BASE_URL}/raw/summary`, params);

export const fetchPodRawSummary = (
  target: PodMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricRawSummaryResponse>(
    `${BASE_URL}/${encode(target.podUid)}/raw/summary`,
    params
  );

export const fetchPodsRawEfficiency = (params?: MetricRangeQueryParams) =>
  metricGet<MetricRawEfficiencyResponse>(
    `${BASE_URL}/raw/efficiency`,
    params
  );

export const fetchPodRawEfficiency = (
  target: PodMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricRawEfficiencyResponse>(
    `${BASE_URL}/${encode(target.podUid)}/raw/efficiency`,
    params
  );

export const fetchPodsCost = (params?: MetricRangeQueryParams) =>
  metricGet<MetricGetResponse>(`${BASE_URL}/cost`, params);

export const fetchPodCost = (
  target: PodMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricGetResponse>(
    `${BASE_URL}/${encode(target.podUid)}/cost`,
    params
  );

export const fetchPodsCostSummary = (params?: MetricRangeQueryParams) =>
  metricGet<MetricCostSummaryResponse>(`${BASE_URL}/cost/summary`, params);

export const fetchPodCostSummary = (
  target: PodMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricCostSummaryResponse>(
    `${BASE_URL}/${encode(target.podUid)}/cost/summary`,
    params
  );

export const fetchPodsCostTrend = (params?: MetricRangeQueryParams) =>
  metricGet<MetricCostTrendResponse>(`${BASE_URL}/cost/trend`, params);

export const fetchPodCostTrend = (
  target: PodMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricCostTrendResponse>(
    `${BASE_URL}/${encode(target.podUid)}/cost/trend`,
    params
  );

