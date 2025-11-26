import { makeK8sListFetcher } from "@/shared/api/info/k8s/utils";
import type { ApiResponse } from "@/types/api";
import type { K8sNamespaceList } from "./dto";

const fetcher = makeK8sListFetcher("namespaces");

export const fetchK8sNamespaces = (): Promise<ApiResponse<K8sNamespaceList>> =>
  fetcher();

