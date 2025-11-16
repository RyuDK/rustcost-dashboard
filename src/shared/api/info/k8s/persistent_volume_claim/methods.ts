import { makeK8sListFetcher } from "../utils";
import type { ApiResponse } from "../../../base";
import type { K8sPersistentVolumeClaimList } from "./dto";

const fetcher = makeK8sListFetcher("persistentvolumeclaims");

export const fetchK8sPersistentVolumeClaims = (): Promise<
  ApiResponse<K8sPersistentVolumeClaimList>
> => fetcher();

