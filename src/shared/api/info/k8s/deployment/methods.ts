import { makeK8sListFetcher } from "@/shared/api/info/k8s/utils";
import type { ApiResponse } from "@/shared/api/base";
import type { K8sDeploymentList } from "./dto";

const fetcher = makeK8sListFetcher("deployments");

export const fetchK8sDeployments = (): Promise<
  ApiResponse<K8sDeploymentList>
> => fetcher();

