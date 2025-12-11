import { INFO_BASE } from "@/shared/api/base";
import { request } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";
import type { K8sResourceList } from "@/types/k8s";

export const makeK8sListFetcher = <T = K8sResourceList>(resource: string) => () =>
  request<ApiResponse<T>>({
    method: "GET",
    url: `${INFO_BASE}/k8s/${resource}`,
  });

