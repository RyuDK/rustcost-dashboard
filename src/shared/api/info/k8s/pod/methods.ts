import { INFO_BASE, encode, buildK8sListQuery } from "@/shared/api/base";
import { request, type PaginationParams } from "@/shared/api/http";
import type { ApiResponse, K8sListQueryParams } from "@/types/api";
import type {
  InfoPod,
  InfoK8sPodPatchRequest,
  K8sPod,
  K8sPodPage,
} from "./dto";

const BASE_URL = `${INFO_BASE}/k8s/store/pods`;
const LIVE_BASE_URL = `${INFO_BASE}/k8s/live/pods`;

export const fetchInfoK8sPods = (params?: K8sListQueryParams) =>
  request<ApiResponse<InfoPod[]>>({
    method: "GET",
    url: BASE_URL,
    params: buildK8sListQuery(params),
  });

export const getInfoK8sPod = (podUid: string) =>
  request<ApiResponse<InfoPod>>({
    method: "GET",
    url: `${BASE_URL}/${encode(podUid)}`,
  });

export const patchInfoK8sPod = (
  podUid: string,
  payload: InfoK8sPodPatchRequest
) =>
  request<ApiResponse<InfoPod>>({
    method: "PATCH",
    url: `${BASE_URL}/${encode(podUid)}`,
    data: payload,
  });

export const fetchK8sLivePods = (params?: PaginationParams) =>
  request<ApiResponse<K8sPodPage>>({
    method: "GET",
    url: LIVE_BASE_URL,
    params,
  });

export const getK8sLivePod = (podUid: string) =>
  request<ApiResponse<K8sPod>>({
    method: "GET",
    url: `${LIVE_BASE_URL}/${encode(podUid)}`,
  });
