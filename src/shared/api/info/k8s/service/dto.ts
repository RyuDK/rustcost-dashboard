import type { PaginatedResponse } from "@/types/api";
import type { K8sService } from "@/types/k8s";

export type K8sServiceList = K8sService[];
export type K8sServicePage = PaginatedResponse<K8sService>;
