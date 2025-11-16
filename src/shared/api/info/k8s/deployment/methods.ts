import { makeK8sListFetcher } from "../utils";
import type { ApiResponse } from "../../../base";
import type { K8sDeploymentList } from "./dto";

const fetcher = makeK8sListFetcher("deployments");

export const fetchK8sDeployments = (): Promise<
  ApiResponse<K8sDeploymentList>
> => fetcher();

