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

export interface K8sDeploymentSpec {
  replicas?: number;
  selector?: {
    matchLabels?: Record<string, string>;
  };
  strategy?: {
    type?: string;
    rollingUpdate?: {
      maxSurge?: string | number;
      maxUnavailable?: string | number;
    };
  };
  template?: {
    metadata?: {
      labels?: Record<string, string>;
    };
    spec?: {
      containers?: K8sContainerSpec[];
      nodeSelector?: Record<string, string>;
      serviceAccountName?: string;
      volumes?: Array<Record<string, unknown>>;
    };
  };
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
