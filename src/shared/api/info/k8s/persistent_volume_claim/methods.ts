import { INFO_BASE } from "@/shared/api/base";
import { request, type PaginationParams } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";
import type { K8sPersistentVolumeClaimPage } from "./dto";

export const fetchK8sPersistentVolumeClaims = (
  params?: PaginationParams
): Promise<ApiResponse<K8sPersistentVolumeClaimPage>> =>
  request<ApiResponse<K8sPersistentVolumeClaimPage>>({
    method: "GET",
    url: `${INFO_BASE}/k8s/persistentvolumeclaims`,
    params,
  });

