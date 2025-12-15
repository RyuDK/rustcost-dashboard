import type { IsoDateTimeString, PaginatedResponse } from "@/types/api";
import type { InfoK8sNodePatchRequest } from "@/shared/api/info/k8s/node/dto";
import type { K8sPod } from "@/types/k8s";

export interface InfoPod {
  podName?: string;
  namespace?: string;
  podUid?: string;
  creationTimestamp?: IsoDateTimeString;
  startTime?: IsoDateTimeString;
  resourceVersion?: string;
  lastUpdatedInfoAt?: IsoDateTimeString;
  deleted?: boolean;
  lastCheckDeletedCount?: number;
  nodeName?: string;
  hostIp?: string;
  podIp?: string;
  qosClass?: string;
  phase?: string;
  ready?: boolean;
  restartCount?: number;
  ownerKind?: string;
  ownerName?: string;
  ownerUid?: string;
  containerCount?: number;
  containerNames?: string[];
  containerImages?: string[];
  containerIds?: string[];
  containerStartedAt?: IsoDateTimeString[];
  imageIds?: string[];
  containerPorts?: number[];
  restartPolicy?: string;
  schedulerName?: string;
  serviceAccount?: string;
  volumeCount?: number;
  volumeNames?: string[];
  pvcNames?: string[];
  mountPaths?: string[];
  terminationGracePeriodSeconds?: number;
  tolerations?: string[];
  label?: string;
  annotation?: string;
  team?: string;
  service?: string;
  env?: string;
}

export type InfoK8sPodPatchRequest = InfoK8sNodePatchRequest;

export type K8sPodList = K8sPod[];
export type K8sPodPage = PaginatedResponse<K8sPod>;
