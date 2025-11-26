import { makeK8sListFetcher } from "@/shared/api/info/k8s/utils";
import type { ApiResponse } from "@/types/api";
import type { K8sLimitRangeList } from "./dto";

const fetcher = makeK8sListFetcher("limitranges");

export const fetchK8sLimitRanges = (): Promise<
  ApiResponse<K8sLimitRangeList>
> => fetcher();

