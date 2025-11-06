export interface InfoResponse<T> {
  resource: string;
  data: T;
  fetchedAt: string;
}

export interface NodeMetadata {
  id: string;
  name: string;
  role?: string;
  region?: string;
  zone?: string;
  labels?: Record<string, string>;
  status: "ready" | "not_ready" | "cordoned" | "unknown";
}

export interface NodeConfiguration {
  kubernetesVersion: string;
  capacityCores: number;
  capacityMemoryBytes: number;
  operatingSystem: string;
  kernelVersion?: string;
}

export interface PodMetadata {
  id: string;
  name: string;
  namespace: string;
  nodeName: string;
  status: string;
  labels?: Record<string, string>;
}

export interface PodConfiguration {
  qosClass: string;
  containers: Array<{
    name: string;
    image: string;
    requests: { cpu?: number; memoryBytes?: number };
    limits: { cpu?: number; memoryBytes?: number };
  }>;
}

export interface ContainerMetadata {
  id: string;
  name: string;
  image: string;
  runtime: string;
  restartCount: number;
  podUid: string;
}

export interface ContainerConfiguration {
  resources: {
    requests: { cpu?: number; memoryBytes?: number };
    limits: { cpu?: number; memoryBytes?: number };
  };
  env?: Record<string, string>;
}

export interface SettingsMetadata {
  featureFlags: Record<string, boolean>;
  defaultCurrency: string;
  defaultDateRangeDays: number;
  notificationsEnabled: boolean;
}

export interface SettingsConfiguration {
  alerts: {
    costThreshold: number;
    efficiencyThreshold: number;
  };
  sampling: {
    intervalSeconds: number;
    retentionDays: number;
  };
}

export type InfoQueryParams = Record<string, string | number | boolean | undefined>;
