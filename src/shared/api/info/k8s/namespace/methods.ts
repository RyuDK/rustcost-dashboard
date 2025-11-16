import { makeK8sListFetcher } from "../utils";
import type { ApiResponse } from "../../../base";
import type { K8sNamespaceList } from "./dto";

const fetcher = makeK8sListFetcher("namespaces");

export const fetchK8sNamespaces = (): Promise<ApiResponse<K8sNamespaceList>> =>
  fetcher();

