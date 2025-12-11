import { INFO_BASE } from "@/shared/api/base";
import { request, type PaginationParams } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";
import type { K8sDeploymentPage } from "./dto";

export const fetchK8sDeployments = (
  params?: PaginationParams
): Promise<ApiResponse<K8sDeploymentPage>> =>
  request<ApiResponse<K8sDeploymentPage>>({
    method: "GET",
    url: `${INFO_BASE}/k8s/deployments`,
    params,
  });

