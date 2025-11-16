import { INFO_BASE, type ApiResponse } from "../../base";
import { request } from "../../http";
import type { K8sResourceList } from "./types";

export const makeK8sListFetcher = (resource: string) => () =>
  request<ApiResponse<K8sResourceList>>({
    method: "GET",
    url: `${INFO_BASE}/k8s/${resource}`,
  });

