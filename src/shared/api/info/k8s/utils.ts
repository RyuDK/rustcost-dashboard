import { INFO_BASE, type ApiResponse } from "@/shared/api/base";
import { request } from "@/shared/api/http";
import type { K8sResourceList } from "./types";

export const makeK8sListFetcher = (resource: string) => () =>
  request<ApiResponse<K8sResourceList>>({
    method: "GET",
    url: `${INFO_BASE}/k8s/${resource}`,
  });

