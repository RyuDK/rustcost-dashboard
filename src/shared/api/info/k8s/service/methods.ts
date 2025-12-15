import { INFO_BASE } from "@/shared/api/base";
import { request, type PaginationParams } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";
import type { K8sServicePage } from "./dto";

export const fetchK8sServices = (
  params?: PaginationParams
): Promise<ApiResponse<K8sServicePage>> =>
  request<ApiResponse<K8sServicePage>>({
    method: "GET",
    url: `${INFO_BASE}/k8s/live/services`,
    params,
  });
