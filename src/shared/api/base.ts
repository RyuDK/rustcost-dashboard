import { API_BASE_PATH } from "./constants";
import { request } from "./http";

export const API_BASE = API_BASE_PATH;
export const INFO_BASE = `${API_BASE_PATH}/info`;
export const METRICS_BASE = `${API_BASE_PATH}/metrics`;
export const SYSTEM_BASE = `${API_BASE_PATH}/system`;
export const encode = encodeURIComponent;

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

export const buildK8sListQuery = (
  params?: K8sListQueryParams
): QueryDict | undefined => {
  if (!params) {
    return undefined;
  }

  return {
    namespace: params.namespace,
    label_selector: params.labelSelector,
    node_name: params.nodeName,
  };
};

export const metricGet = <T>(
  url: string,
  params?: MetricRangeQueryParams
) =>
  request<ApiResponse<T>>({
    method: "GET",
    url,
    params,
  });
