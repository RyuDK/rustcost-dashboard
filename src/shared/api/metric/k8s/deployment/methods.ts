import {
  METRICS_BASE,
  encode,
  metricGet,
  type MetricRangeQueryParams,
} from "../../../base";
import type {
  DeploymentMetricTargetParams,
  MetricGetResponse,
  MetricRawSummaryResponse,
  MetricRawEfficiencyResponse,
  MetricCostSummaryResponse,
  MetricCostTrendResponse,
} from "../../types";

const BASE_URL = `${METRICS_BASE}/deployments`;

export const fetchDeploymentsRaw = (params?: MetricRangeQueryParams) =>
  metricGet<MetricGetResponse>(`${BASE_URL}/raw`, params);

export const fetchDeploymentRaw = (
  target: DeploymentMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricGetResponse>(
    `${BASE_URL}/${encode(target.deployment)}/raw`,
    params
  );

export const fetchDeploymentsRawSummary = (
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricRawSummaryResponse>(`${BASE_URL}/raw/summary`, params);

export const fetchDeploymentRawSummary = (
  target: DeploymentMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricRawSummaryResponse>(
    `${BASE_URL}/${encode(target.deployment)}/raw/summary`,
    params
  );

export const fetchDeploymentsRawEfficiency = (
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricRawEfficiencyResponse>(
    `${BASE_URL}/raw/efficiency`,
    params
  );

export const fetchDeploymentRawEfficiency = (
  target: DeploymentMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricRawEfficiencyResponse>(
    `${BASE_URL}/${encode(target.deployment)}/raw/efficiency`,
    params
  );

export const fetchDeploymentsCost = (params?: MetricRangeQueryParams) =>
  metricGet<MetricGetResponse>(`${BASE_URL}/cost`, params);

export const fetchDeploymentCost = (
  target: DeploymentMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricGetResponse>(
    `${BASE_URL}/${encode(target.deployment)}/cost`,
    params
  );

export const fetchDeploymentsCostSummary = (
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricCostSummaryResponse>(`${BASE_URL}/cost/summary`, params);

export const fetchDeploymentCostSummary = (
  target: DeploymentMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricCostSummaryResponse>(
    `${BASE_URL}/${encode(target.deployment)}/cost/summary`,
    params
  );

export const fetchDeploymentsCostTrend = (
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricCostTrendResponse>(`${BASE_URL}/cost/trend`, params);

export const fetchDeploymentCostTrend = (
  target: DeploymentMetricTargetParams,
  params?: MetricRangeQueryParams
) =>
  metricGet<MetricCostTrendResponse>(
    `${BASE_URL}/${encode(target.deployment)}/cost/trend`,
    params
  );

