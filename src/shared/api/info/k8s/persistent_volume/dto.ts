import type { PaginatedResponse } from "@/types/api";
import type { K8sPersistentVolume } from "@/types/k8s";

export type K8sPersistentVolumeList = K8sPersistentVolume[];
export type K8sPersistentVolumePage = PaginatedResponse<K8sPersistentVolume>;

