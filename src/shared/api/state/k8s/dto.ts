export type K8sDateTime = string;

export interface RuntimePod {
  uid: string;
  name: string;
  namespace: string;
  deployment?: string | null;
  node: string;
  containers: string[];
}

export interface K8sRuntimeState {
  last_discovered_at: K8sDateTime | null;
  last_error_at: K8sDateTime | null;
  nodes: string[];
  namespaces: string[];
  deployments: string[];
  pods: Record<string, RuntimePod>;
  pods_by_namespace: Record<string, string[]>;
  pods_by_node: Record<string, string[]>;
  pods_by_deployment: Record<string, string[]>;
  last_error_message: string | null;
}
