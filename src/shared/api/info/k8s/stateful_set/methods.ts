import { INFO_BASE } from "@/shared/api/base";
import { request, type PaginationParams } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";
import type { K8sStatefulSetPage } from "./dto";

export const fetchK8sStatefulSets = (
  params?: PaginationParams
): Promise<ApiResponse<K8sStatefulSetPage>> =>
  request<ApiResponse<K8sStatefulSetPage>>({
    method: "GET",
    url: `${INFO_BASE}/k8s/live/statefulsets`,
    params,
  });
