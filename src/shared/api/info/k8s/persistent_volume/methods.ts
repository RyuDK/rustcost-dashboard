import { makeK8sListFetcher } from "@/shared/api/info/k8s/utils";
import type { ApiResponse } from "@/types/api";
import type { K8sPersistentVolumeList } from "./dto";

const fetcher = makeK8sListFetcher("persistentvolumes");

export const fetchK8sPersistentVolumes = (): Promise<
  ApiResponse<K8sPersistentVolumeList>
> => fetcher();

