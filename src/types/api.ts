import type { METRIC_RESOURCES } from "@/constants/api";

export type IsoDateTimeString = string;

export interface ApiResponse<T> {
  is_successful: boolean;
  data?: T;
  error_code?: string;
  error_msg?: string;
}

export type QueryDict = Record<string, string | number | boolean | undefined>;

export type MetricGranularity = "minute" | "hour" | "day";

export type MetricScope =
  | "cluster"
  | "node"
  | "pod"
  | "container"
  | "namespace"
  | "deployment";

export interface MetricRangeQueryParams {
  start?: IsoDateTimeString;
  end?: IsoDateTimeString;
  limit?: number;
  offset?: number;
  sort?: string;
  metric?: string | string[];
  namespace?: string;
  granularity?: MetricGranularity;
  team?: string;
  service?: string;
  env?: string;
}

export interface K8sListQueryParams {
  namespace?: string;
  labelSelector?: string;
  nodeName?: string;
}

export type MetricResource = (typeof METRIC_RESOURCES)[number];
