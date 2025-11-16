import {
  METRICS_BASE,
  encode,
  metricGet,
  type MetricRangeQueryParams,
} from "../../../base";
import type {
  NamespaceMetricTargetParams,
  MetricGetResponse,
  MetricRawSummaryResponse,
  MetricRawEfficiencyResponse,
  MetricCostSummaryResponse,
  MetricCostTrendResponse,
} from "../../types";

const BASE_URL = `${METRICS_BASE}/namespaces`;

export const fetchNamespacesRaw = (params?: MetricRangeQueryParams) =>
  metricGet<MetricGetResponse>(`${BASE_URL}/raw`, params);

export const fetchNamespaceRaw = (
  target: NamespaceMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricGetResponse>(
    `${BASE_URL}/${encode(target.namespace)}/raw`,
    params
  );

export const fetchNamespacesRawSummary = (params?: MetricRangeQueryParams) =>
  metricGet<MetricRawSummaryResponse>(`${BASE_URL}/raw/summary`, params);

export const fetchNamespaceRawSummary = (
  target: NamespaceMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricRawSummaryResponse>(
    `${BASE_URL}/${encode(target.namespace)}/raw/summary`,
    params
  );

export const fetchNamespacesRawEfficiency = (
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricRawEfficiencyResponse>(
    `${BASE_URL}/raw/efficiency`,
    params
  );

export const fetchNamespaceRawEfficiency = (
  target: NamespaceMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricRawEfficiencyResponse>(
    `${BASE_URL}/${encode(target.namespace)}/raw/efficiency`,
    params
  );

export const fetchNamespacesCost = (params?: MetricRangeQueryParams) =>
  metricGet<MetricGetResponse>(`${BASE_URL}/cost`, params);

export const fetchNamespaceCost = (
  target: NamespaceMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricGetResponse>(
    `${BASE_URL}/${encode(target.namespace)}/cost`,
    params
  );

export const fetchNamespacesCostSummary = (
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricCostSummaryResponse>(`${BASE_URL}/cost/summary`, params);

export const fetchNamespaceCostSummary = (
  target: NamespaceMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricCostSummaryResponse>(
    `${BASE_URL}/${encode(target.namespace)}/cost/summary`,
    params
  );

export const fetchNamespacesCostTrend = (params?: MetricRangeQueryParams) =>
  metricGet<MetricCostTrendResponse>(`${BASE_URL}/cost/trend`, params);

export const fetchNamespaceCostTrend = (
  target: NamespaceMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricCostTrendResponse>(
    `${BASE_URL}/${encode(target.namespace)}/cost/trend`,
    params
  );

