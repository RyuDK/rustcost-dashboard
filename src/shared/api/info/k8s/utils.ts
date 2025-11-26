import { INFO_BASE } from "@/shared/api/base";
import { request } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";
import type { K8sResourceList } from "@/types/k8s";

export const makeK8sListFetcher = (resource: string) => () =>
  request<ApiResponse<K8sResourceList>>({
    method: "GET",
    url: `${INFO_BASE}/k8s/${resource}`,
  });

