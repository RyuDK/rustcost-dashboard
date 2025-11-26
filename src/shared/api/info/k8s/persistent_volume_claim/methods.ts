import { makeK8sListFetcher } from "@/shared/api/info/k8s/utils";
import type { ApiResponse } from "@/shared/api/base";
import type { K8sPersistentVolumeClaimList } from "./dto";

const fetcher = makeK8sListFetcher("persistentvolumeclaims");

export const fetchK8sPersistentVolumeClaims = (): Promise<
  ApiResponse<K8sPersistentVolumeClaimList>
> => fetcher();

