import { makeK8sListFetcher } from "@/shared/api/info/k8s/utils";
import type { ApiResponse } from "@/types/api";
import type { K8sResourceQuotaList } from "./dto";

const fetcher = makeK8sListFetcher("resourcequotas");

export const fetchK8sResourceQuotas = (): Promise<
  ApiResponse<K8sResourceQuotaList>
> => fetcher();

