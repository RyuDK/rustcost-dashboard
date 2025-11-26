import { makeK8sListFetcher } from "@/shared/api/info/k8s/utils";
import type { ApiResponse } from "@/shared/api/base";
import type { K8sHorizontalPodAutoscalerList } from "./dto";

const fetcher = makeK8sListFetcher("horizontalpodautoscalers");

export const fetchK8sHorizontalPodAutoscalers = (): Promise<
  ApiResponse<K8sHorizontalPodAutoscalerList>
> => fetcher();

