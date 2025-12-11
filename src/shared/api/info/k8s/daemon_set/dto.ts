import type { PaginatedResponse } from "@/types/api";
import type { K8sDaemonSet } from "@/types/k8s";

export type K8sDaemonSetList = K8sDaemonSet[];
export type K8sDaemonSetPage = PaginatedResponse<K8sDaemonSet>;
