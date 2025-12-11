import type { PaginatedResponse } from "@/types/api";
import type { K8sDeployment } from "@/types/k8s";

export type K8sDeploymentList = K8sDeployment[];
export type K8sDeploymentPage = PaginatedResponse<K8sDeployment>;

