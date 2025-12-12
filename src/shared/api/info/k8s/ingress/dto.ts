import type { PaginatedResponse } from "@/types/api";
import type { K8sIngress } from "@/types/k8s";

export type K8sIngressList = K8sIngress[];
export type K8sIngressPage = PaginatedResponse<K8sIngress>;
