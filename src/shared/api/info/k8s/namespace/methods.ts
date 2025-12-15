import { INFO_BASE } from "@/shared/api/base";
import { request, type PaginationParams } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";
import type { K8sNamespacePage } from "./dto";

export const fetchK8sNamespaces = (
  params?: PaginationParams
): Promise<ApiResponse<K8sNamespacePage>> =>
  request<ApiResponse<K8sNamespacePage>>({
    method: "GET",
    url: `${INFO_BASE}/k8s/live/namespaces`,
    params,
  });
