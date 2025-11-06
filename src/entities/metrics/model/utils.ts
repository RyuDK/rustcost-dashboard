import type { MetricResource } from "../../../shared/api/constants";
import type { MetricsQueryOptions, MetricsSeries } from "./types";

type Primitive = string | number | boolean | null | undefined;

const normalizeArrayParam = (value?: string | string[]) => {
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value.join(",") : value;
};

export const serializeMetricsParams = (
  params: MetricsQueryOptions = {}
): Record<string, Primitive> => {
  const {
    start,
    end,
    limit,
    offset,
    sort,
    metric,
    currency,
  } = params;

  return {
    start,
    end,
    limit,
    offset,
    sort,
    metric: normalizeArrayParam(metric),
    currency,
  };
};

export const buildMetricsQueryKey = (
  resource: MetricResource,
  series: MetricsSeries,
  params?: MetricsQueryOptions
) =>
  JSON.stringify({
    scope: "metrics",
    resource,
    series,
    params: serializeMetricsParams(params),
  });
