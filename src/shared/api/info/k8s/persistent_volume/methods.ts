import { INFO_BASE } from "@/shared/api/base";
import { request, type PaginationParams } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";
import type { K8sPersistentVolumePage } from "./dto";

export const fetchK8sPersistentVolumes = (
  params?: PaginationParams
): Promise<ApiResponse<K8sPersistentVolumePage>> =>
  request<ApiResponse<K8sPersistentVolumePage>>({
    method: "GET",
    url: `${INFO_BASE}/k8s/live/persistentvolumes`,
    params,
  });
