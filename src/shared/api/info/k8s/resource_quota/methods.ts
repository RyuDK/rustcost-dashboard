import { makeK8sListFetcher } from "../utils";
import type { ApiResponse } from "../../../base";
import type { K8sResourceQuotaList } from "./dto";

const fetcher = makeK8sListFetcher("resourcequotas");

export const fetchK8sResourceQuotas = (): Promise<
  ApiResponse<K8sResourceQuotaList>
> => fetcher();

