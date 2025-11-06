import { API_BASE_PATH, type MetricResource } from "../../../shared/api/constants";
import {
  request,
  type MetricsQueryParams,
} from "../../../shared/api/http";
import {
  buildMetricsQueryKey,
  serializeMetricsParams,
} from "../model/utils";
import type {
  CostMetricPoint,
  EfficiencyMetric,
  MetricsQueryOptions,
  MetricsResponse,
  SummaryMetric,
  TrendMetricPoint,
} from "../model/types";

type SeriesMap = {
  cost: CostMetricPoint;
  summary: SummaryMetric;
  trends: TrendMetricPoint;
  efficiency: EfficiencyMetric;
};

type SeriesKey = keyof SeriesMap;

/**
 * Builds a REST path for the given metrics resource and data series.
 */
const buildMetricsUrl = (
  resource: MetricResource,
  series: SeriesKey
) => `${API_BASE_PATH}/metrics/${resource}/${series}`;

/**
 * Factory that produces a typed fetcher for a metrics series.
 *
 * @param resource - Metrics resource name (e.g. nodes, pods).
 * @param series - Metrics series identifier.
 */
const makeRequest =
  <S extends SeriesKey, T = SeriesMap[S]>(
    resource: MetricResource,
    series: S
  ) =>
  (params: MetricsQueryOptions = {}) =>
    request<MetricsResponse<SeriesMap[S]>>({
      method: "GET",
      url: buildMetricsUrl(resource, series),
      params: serializeMetricsParams(params),
    });

/**
 * Creates a typed client for a metrics resource (e.g. nodes, pods).
 *
 * @param resource - Metrics resource to target.
 */
export const createMetricsResourceClient = (resource: MetricResource) => ({
  resource,
  cost: makeRequest(resource, "cost"),
  summary: makeRequest(resource, "summary"),
  trends: makeRequest(resource, "trends"),
  efficiency: makeRequest(resource, "efficiency"),
});

export type MetricsResourceClient = ReturnType<
  typeof createMetricsResourceClient
>;

export type MetricsFetcher<S extends SeriesKey> = (
  params?: MetricsQueryParams
) => Promise<MetricsResponse<SeriesMap[S]>>;

/**
 * Generates a stable cache key for metric queries that feed into hooks.
 */
export const composeMetricsQueryKey = (
  resource: MetricResource,
  series: SeriesKey,
  params?: MetricsQueryParams
) => buildMetricsQueryKey(resource, series, params);
