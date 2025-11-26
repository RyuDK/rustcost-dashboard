import {
  METRICS_BASE,
  encode,
  metricGet,
} from "@/shared/api/base";
import type { MetricRangeQueryParams } from "@/types/api";
import type {
  ContainerMetricTargetParams,
  MetricGetResponse,
  MetricRawSummaryResponse,
  MetricRawEfficiencyResponse,
  MetricCostSummaryResponse,
  MetricCostTrendResponse,
} from "@/types/metrics";

const BASE_URL = `${METRICS_BASE}/containers`;

export const fetchContainersRaw = (params?: MetricRangeQueryParams) =>
  metricGet<MetricGetResponse>(`${BASE_URL}/raw`, params);

export const fetchContainerRaw = (
  target: ContainerMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricGetResponse>(
    `${BASE_URL}/${encode(target.containerId)}/raw`,
    params
  );

export const fetchContainersRawSummary = (params?: MetricRangeQueryParams) =>
  metricGet<MetricRawSummaryResponse>(`${BASE_URL}/raw/summary`, params);

export const fetchContainerRawSummary = (
  target: ContainerMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricRawSummaryResponse>(
    `${BASE_URL}/${encode(target.containerId)}/raw/summary`,
    params
  );

export const fetchContainersRawEfficiency = (
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricRawEfficiencyResponse>(
    `${BASE_URL}/raw/efficiency`,
    params
  );

export const fetchContainerRawEfficiency = (
  target: ContainerMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricRawEfficiencyResponse>(
    `${BASE_URL}/${encode(target.containerId)}/raw/efficiency`,
    params
  );

export const fetchContainersCost = (params?: MetricRangeQueryParams) =>
  metricGet<MetricGetResponse>(`${BASE_URL}/cost`, params);

export const fetchContainerCost = (
  target: ContainerMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricGetResponse>(
    `${BASE_URL}/${encode(target.containerId)}/cost`,
    params
  );

export const fetchContainersCostSummary = (
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricCostSummaryResponse>(`${BASE_URL}/cost/summary`, params);

export const fetchContainerCostSummary = (
  target: ContainerMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricCostSummaryResponse>(
    `${BASE_URL}/${encode(target.containerId)}/cost/summary`,
    params
  );

export const fetchContainersCostTrend = (params?: MetricRangeQueryParams) =>
  metricGet<MetricCostTrendResponse>(`${BASE_URL}/cost/trend`, params);

export const fetchContainerCostTrend = (
  target: ContainerMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricCostTrendResponse>(
    `${BASE_URL}/${encode(target.containerId)}/cost/trend`,
    params
  );

