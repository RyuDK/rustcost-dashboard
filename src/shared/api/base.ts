import { API_BASE_PATH } from "@/constants/api";
import { request } from "./http";
import type {
  K8sListQueryParams,
  MetricRangeQueryParams,
  QueryDict,
} from "@/types/api";

export const API_BASE = API_BASE_PATH;
export const INFO_BASE = `${API_BASE_PATH}/info`;
export const METRICS_BASE = `${API_BASE_PATH}/metrics`;
export const SYSTEM_BASE = `${API_BASE_PATH}/system`;
export const encode = encodeURIComponent;

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
