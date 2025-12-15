import { INFO_BASE } from "@/shared/api/base";
import { request, type PaginationParams } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";
import type { K8sDaemonSetPage } from "./dto";

export const fetchK8sDaemonSets = (
  params?: PaginationParams
): Promise<ApiResponse<K8sDaemonSetPage>> =>
  request<ApiResponse<K8sDaemonSetPage>>({
    method: "GET",
    url: `${INFO_BASE}/k8s/live/daemonsets`,
    params,
  });
