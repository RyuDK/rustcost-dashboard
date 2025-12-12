import type { PaginatedResponse } from "@/types/api";
import type { K8sStatefulSet } from "@/types/k8s";

export type K8sStatefulSetList = K8sStatefulSet[];
export type K8sStatefulSetPage = PaginatedResponse<K8sStatefulSet>;
