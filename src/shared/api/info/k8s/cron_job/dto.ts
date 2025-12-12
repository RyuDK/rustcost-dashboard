import type { PaginatedResponse } from "@/types/api";
import type { K8sCronJob } from "@/types/k8s";

export type K8sCronJobList = K8sCronJob[];
export type K8sCronJobPage = PaginatedResponse<K8sCronJob>;
