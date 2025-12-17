import { INFO_BASE, encode } from "@/shared/api/base";
import { request, type PaginationParams } from "@/shared/api/http";
import type { ApiResponse, QueryDict } from "@/types/api";
import type {
  InfoNode,
  InfoK8sNodePatchRequest,
  InfoK8sNodePricePatchRequest,
  InfoK8sNodeListQuery,
  K8sNode,
  K8sNodePage,
} from "./dto";

const BASE_URL = `${INFO_BASE}/k8s/store/nodes`;
const LIVE_BASE_URL = `${INFO_BASE}/k8s/live/nodes`;

export const fetchInfoK8sNodes = (payload?: InfoK8sNodeListQuery) =>
  request<ApiResponse<InfoNode[]>>({
    method: "GET",
    url: BASE_URL,
    params: (() => {
      if (!payload) return undefined;
      const params: QueryDict = {};
      if (payload.team) params["team"] = payload.team;
      if (payload.service) params["service"] = payload.service;
      if (payload.env) params["env"] = payload.env;
      return params;
    })(),
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
    url: `${BASE_URL}/${encode(nodeName)}/filter`,
    data: payload,
  });

export const patchInfoK8sNodePrice = (
  nodeName: string,
  payload: InfoK8sNodePricePatchRequest
) =>
  request<ApiResponse<InfoNode>>({
    method: "PATCH",
    url: `${BASE_URL}/${encode(nodeName)}/price`,
    data: payload,
  });

export const fetchK8sLiveNodes = (params?: PaginationParams) =>
  request<ApiResponse<K8sNodePage>>({
    method: "GET",
    url: LIVE_BASE_URL,
    params,
  });

export const getK8sLiveNode = (nodeName: string) =>
  request<ApiResponse<K8sNode>>({
    method: "GET",
    url: `${LIVE_BASE_URL}/${encode(nodeName)}`,
  });
