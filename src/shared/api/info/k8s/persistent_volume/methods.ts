import { makeK8sListFetcher } from "../utils";
import type { ApiResponse } from "../../../base";
import type { K8sPersistentVolumeList } from "./dto";

const fetcher = makeK8sListFetcher("persistentvolumes");

export const fetchK8sPersistentVolumes = (): Promise<
  ApiResponse<K8sPersistentVolumeList>
> => fetcher();

