import {
  INFO_BASE,
  encode,
  buildK8sListQuery,
  type ApiResponse,
  type K8sListQueryParams,
} from "@/shared/api/base";
import { request } from "@/shared/api/http";
import type { InfoNode, InfoK8sNodePatchRequest } from "./dto";

const BASE_URL = `${INFO_BASE}/k8s/nodes`;

export const fetchInfoK8sNodes = (params?: K8sListQueryParams) =>
  request<ApiResponse<InfoNode[]>>({
    method: "GET",
    url: BASE_URL,
    params: buildK8sListQuery(params),
  });

export const getInfoK8sNode = (nodeName: string) =>
  request<ApiResponse<InfoNode>>({
    method: "GET",
    url: `${BASE_URL}/${encode(nodeName)}`,
  });

export const patchInfoK8sNode = (
  nodeName: string,
  payload: InfoK8sNodePatchRequest
) =>
  request<ApiResponse<InfoNode>>({
    method: "PATCH",
    url: `${BASE_URL}/${encode(nodeName)}`,
    data: payload,
  });

