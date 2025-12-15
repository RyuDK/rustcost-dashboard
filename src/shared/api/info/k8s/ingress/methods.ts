import { INFO_BASE } from "@/shared/api/base";
import { request, type PaginationParams } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";
import type { K8sIngressPage } from "./dto";

export const fetchK8sIngresses = (
  params?: PaginationParams
): Promise<ApiResponse<K8sIngressPage>> =>
  request<ApiResponse<K8sIngressPage>>({
    method: "GET",
    url: `${INFO_BASE}/k8s/live/ingresses`,
    params,
  });
