import { makeK8sListFetcher } from "../utils";
import type { ApiResponse } from "../../../base";
import type { K8sLimitRangeList } from "./dto";

const fetcher = makeK8sListFetcher("limitranges");

export const fetchK8sLimitRanges = (): Promise<
  ApiResponse<K8sLimitRangeList>
> => fetcher();

