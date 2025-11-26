import type { IsoDateTimeString } from "@/types/api";
import type { InfoK8sNodePatchRequest } from "@/shared/api/info/k8s/node/dto";

export interface InfoContainer {
  podUid?: string;
  containerName?: string;
  namespace?: string;
  creationTimestamp?: IsoDateTimeString;
  startTime?: IsoDateTimeString;
  containerId?: string;
  image?: string;
  imageId?: string;
  state?: string;
  reason?: string;
  message?: string;
  exitCode?: number;
  restartCount?: number;
  ready?: boolean;
  nodeName?: string;
  hostIp?: string;
  podIp?: string;
  cpuRequestMillicores?: number;
  memoryRequestBytes?: number;
  cpuLimitMillicores?: number;
  memoryLimitBytes?: number;
  volumeMounts?: string[];
  volumeDevices?: string[];
  labels?: string;
  annotations?: string;
  lastUpdatedInfoAt?: IsoDateTimeString;
  deleted?: boolean;
  lastCheckDeletedCount?: number;
  team?: string;
  service?: string;
  env?: string;
}

export type InfoK8sContainerPatchRequest = InfoK8sNodePatchRequest;

