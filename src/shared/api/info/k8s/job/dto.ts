import type { PaginatedResponse } from "@/types/api";
import type { K8sJob } from "@/types/k8s";

export type K8sJobList = K8sJob[];
export type K8sJobPage = PaginatedResponse<K8sJob>;
