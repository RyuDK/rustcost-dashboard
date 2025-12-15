import { INFO_BASE } from "@/shared/api/base";
import { request, type PaginationParams } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";
import type { K8sCronJobPage } from "./dto";

export const fetchK8sCronJobs = (
  params?: PaginationParams
): Promise<ApiResponse<K8sCronJobPage>> =>
  request<ApiResponse<K8sCronJobPage>>({
    method: "GET",
    url: `${INFO_BASE}/k8s/live/cronjobs`,
    params,
  });
