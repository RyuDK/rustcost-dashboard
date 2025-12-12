import { INFO_BASE } from "@/shared/api/base";
import { request, type PaginationParams } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";
import type { K8sJobPage } from "./dto";

export const fetchK8sJobs = (
  params?: PaginationParams
): Promise<ApiResponse<K8sJobPage>> =>
  request<ApiResponse<K8sJobPage>>({
    method: "GET",
    url: `${INFO_BASE}/k8s/jobs`,
    params,
  });
