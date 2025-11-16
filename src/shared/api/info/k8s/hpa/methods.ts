import { makeK8sListFetcher } from "../utils";
import type { ApiResponse } from "../../../base";
import type { K8sHorizontalPodAutoscalerList } from "./dto";

const fetcher = makeK8sListFetcher("horizontalpodautoscalers");

export const fetchK8sHorizontalPodAutoscalers = (): Promise<
  ApiResponse<K8sHorizontalPodAutoscalerList>
> => fetcher();

