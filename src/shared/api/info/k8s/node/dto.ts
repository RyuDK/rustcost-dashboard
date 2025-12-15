import type { IsoDateTimeString, PaginatedResponse } from "@/types/api";
import type { K8sNode } from "@/types/k8s";

export interface InfoNode {
  node_name?: string;
  node_uid?: string;
  creation_timestamp?: IsoDateTimeString;
  resource_version?: string;
  last_updated_info_at?: IsoDateTimeString;
  deleted?: boolean;
  last_check_deleted_count?: number;
  hostname?: string;
  internal_ip?: string;
  architecture?: string;
  os_image?: string;
  kernel_version?: string;
  kubelet_version?: string;
  container_runtime?: string;
  operating_system?: string;
  cpu_capacity_cores?: number;
  memory_capacity_bytes?: number;
  pod_capacity?: number;
  ephemeral_storage_capacity_bytes?: number;
  cpu_allocatable_cores?: number;
  memory_allocatable_bytes?: number;
  ephemeral_storage_allocatable_bytes?: number;
  pod_allocatable?: number;
  ready?: boolean;
  taints?: string;
  label?: string;
  annotation?: string;
  image_count?: number;
  image_names?: string[];
  image_total_size_bytes?: number;
  team?: string;
  service?: string;
  env?: string;
  fixed_instance_usd?: number;
  price_period?: "Unit" | "Hour" | "Day" | "Month";
}

export interface InfoK8sNodePatchRequest {
  team?: string;
  service?: string;
  env?: string;
}

export interface InfoK8sNodePricePatchRequest {
  fixed_instance_usd?: number;
  price_period?: "Unit" | "Hour" | "Day" | "Month";
}

export type K8sNodeList = K8sNode[];
export type K8sNodePage = PaginatedResponse<K8sNode>;
