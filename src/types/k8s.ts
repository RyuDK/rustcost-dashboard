export type K8sResourceList = Record<string, unknown>;

export interface K8sObjectMeta {
  name?: string;
  namespace?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  creationTimestamp?: string;
  uid?: string;
  resourceVersion?: string;
}

export interface K8sContainerSpec {
  name?: string;
  image?: string;
  args?: string[];
  env?: Array<{
    name?: string;
    value?: string;
  }>;
  volumeMounts?: Array<{
    name?: string;
    mountPath?: string;
  }>;
}

export interface K8sPodTemplateSpec {
  metadata?: {
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec?: {
    containers?: K8sContainerSpec[];
    nodeSelector?: Record<string, string>;
    serviceAccountName?: string;
    volumes?: Array<Record<string, unknown>>;
  };
}

export interface K8sLabelSelector {
  matchLabels?: Record<string, string>;
}

export interface K8sDeploymentSpec {
  replicas?: number;
  selector?: K8sLabelSelector;
  strategy?: {
    type?: string;
    rollingUpdate?: {
      maxSurge?: string | number;
      maxUnavailable?: string | number;
    };
  };
  template?: K8sPodTemplateSpec;
}

export interface K8sCondition {
  type?: string;
  status?: string;
  reason?: string;
  message?: string;
  lastUpdateTime?: string;
  lastTransitionTime?: string;
}

export interface K8sDeploymentStatus {
  replicas?: number;
  readyReplicas?: number;
  availableReplicas?: number;
  updatedReplicas?: number;
  observedGeneration?: number;
  conditions?: K8sCondition[];
}

export interface K8sDeployment {
  apiVersion?: string;
  kind?: string;
  metadata?: K8sObjectMeta;
  spec?: K8sDeploymentSpec;
  status?: K8sDeploymentStatus;
}

export interface K8sDaemonSetSpec {
  selector?: K8sLabelSelector;
  template?: K8sPodTemplateSpec;
  updateStrategy?: {
    type?: string;
    rollingUpdate?: {
      maxUnavailable?: string | number;
    };
  };
}

export interface K8sDaemonSetStatus {
  currentNumberScheduled?: number;
  desiredNumberScheduled?: number;
  numberAvailable?: number;
  numberReady?: number;
  updatedNumberScheduled?: number;
  conditions?: K8sCondition[];
}

export interface K8sDaemonSet {
  apiVersion?: string;
  kind?: string;
  metadata?: K8sObjectMeta;
  spec?: K8sDaemonSetSpec;
  status?: K8sDaemonSetStatus;
}

export interface K8sStatefulSetSpec {
  serviceName?: string;
  replicas?: number;
  selector?: K8sLabelSelector;
  template?: K8sPodTemplateSpec;
  updateStrategy?: {
    type?: string;
    rollingUpdate?: {
      partition?: number;
    };
  };
  volumeClaimTemplates?: Array<{
    metadata?: K8sObjectMeta;
    spec?: {
      accessModes?: string[];
      storageClassName?: string;
      resources?: {
        requests?: Record<string, string>;
      };
    };
  }>;
}

export interface K8sStatefulSetStatus {
  replicas?: number;
  readyReplicas?: number;
  currentReplicas?: number;
  updatedReplicas?: number;
  currentRevision?: string;
  updateRevision?: string;
  conditions?: K8sCondition[];
}

export interface K8sStatefulSet {
  apiVersion?: string;
  kind?: string;
  metadata?: K8sObjectMeta;
  spec?: K8sStatefulSetSpec;
  status?: K8sStatefulSetStatus;
}

export interface K8sJobSpec {
  completions?: number;
  parallelism?: number;
  backoffLimit?: number;
  activeDeadlineSeconds?: number;
  template?: K8sPodTemplateSpec;
}

export interface K8sJobStatus {
  startTime?: string;
  completionTime?: string;
  succeeded?: number;
  failed?: number;
  active?: number;
  conditions?: K8sCondition[];
}

export interface K8sJob {
  apiVersion?: string;
  kind?: string;
  metadata?: K8sObjectMeta;
  spec?: K8sJobSpec;
  status?: K8sJobStatus;
}

export interface K8sCronJobSpec {
  schedule?: string;
  suspend?: boolean;
  concurrencyPolicy?: string;
  successfulJobsHistoryLimit?: number;
  failedJobsHistoryLimit?: number;
  jobTemplate?: {
    spec?: K8sJobSpec;
  };
}

export interface K8sCronJobStatus {
  lastScheduleTime?: string;
  active?: Array<{
    name?: string;
    namespace?: string;
    uid?: string;
  }>;
}

export interface K8sCronJob {
  apiVersion?: string;
  kind?: string;
  metadata?: K8sObjectMeta;
  spec?: K8sCronJobSpec;
  status?: K8sCronJobStatus;
}

export interface K8sServicePort {
  name?: string;
  protocol?: string;
  port?: number;
  targetPort?: number | string;
  nodePort?: number;
}

export interface K8sServiceSpec {
  type?: string;
  clusterIP?: string;
  externalIPs?: string[];
  selector?: Record<string, string>;
  ports?: K8sServicePort[];
  sessionAffinity?: string;
}

export interface K8sServiceStatus {
  loadBalancer?: {
    ingress?: Array<{
      ip?: string;
      hostname?: string;
    }>;
  };
}

export interface K8sService {
  apiVersion?: string;
  kind?: string;
  metadata?: K8sObjectMeta;
  spec?: K8sServiceSpec;
  status?: K8sServiceStatus;
}

export interface K8sIngressBackendService {
  name?: string;
  port?: {
    number?: number;
    name?: string;
  };
}

export interface K8sIngressRule {
  host?: string;
  http?: {
    paths?: Array<{
      path?: string;
      pathType?: string;
      backend?: {
        service?: K8sIngressBackendService;
      };
    }>;
  };
}

export interface K8sIngressTLS {
  hosts?: string[];
  secretName?: string;
}

export interface K8sIngressSpec {
  ingressClassName?: string;
  defaultBackend?: {
    service?: K8sIngressBackendService;
  };
  rules?: K8sIngressRule[];
  tls?: K8sIngressTLS[];
}

export interface K8sIngressStatus {
  loadBalancer?: {
    ingress?: Array<{
      ip?: string;
      hostname?: string;
    }>;
  };
}

export interface K8sIngress {
  apiVersion?: string;
  kind?: string;
  metadata?: K8sObjectMeta;
  spec?: K8sIngressSpec;
  status?: K8sIngressStatus;
}

export interface K8sPersistentVolumeSpec {
  capacity?: Record<string, string>;
  accessModes?: string[];
  storageClassName?: string;
  persistentVolumeReclaimPolicy?: string;
  claimRef?: {
    name?: string;
    namespace?: string;
    uid?: string;
  };
  volumeMode?: string;
  nodeAffinity?: Record<string, unknown>;
}

export interface K8sPersistentVolumeStatus {
  phase?: string;
  message?: string;
  reason?: string;
}

export interface K8sPersistentVolume {
  apiVersion?: string;
  kind?: string;
  metadata?: K8sObjectMeta;
  spec?: K8sPersistentVolumeSpec;
  status?: K8sPersistentVolumeStatus;
}

export interface K8sPersistentVolumeClaimSpec {
  accessModes?: string[];
  resources?: {
    requests?: Record<string, string>;
  };
  storageClassName?: string;
  volumeName?: string;
  volumeMode?: string;
  selector?: K8sLabelSelector;
}

export interface K8sPersistentVolumeClaimStatus {
  phase?: string;
  accessModes?: string[];
  capacity?: Record<string, string>;
}

export interface K8sPersistentVolumeClaim {
  apiVersion?: string;
  kind?: string;
  metadata?: K8sObjectMeta;
  spec?: K8sPersistentVolumeClaimSpec;
  status?: K8sPersistentVolumeClaimStatus;
}

export interface K8sNamespace {
  apiVersion?: string;
  kind?: string;
  metadata?: K8sObjectMeta;
  status?: {
    phase?: string;
  };
}
