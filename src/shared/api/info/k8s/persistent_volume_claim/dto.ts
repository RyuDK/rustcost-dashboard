import type { PaginatedResponse } from "@/types/api";
import type { K8sPersistentVolumeClaim } from "@/types/k8s";

export type K8sPersistentVolumeClaimList = K8sPersistentVolumeClaim[];
export type K8sPersistentVolumeClaimPage =
  PaginatedResponse<K8sPersistentVolumeClaim>;

