import type { PaginatedResponse } from "@/types/api";
import type { K8sNamespace } from "@/types/k8s";

export type K8sNamespaceList = K8sNamespace[];
export type K8sNamespacePage = PaginatedResponse<K8sNamespace>;

