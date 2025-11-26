import {
  INFO_BASE,
  encode,
  buildK8sListQuery,
} from "@/shared/api/base";
import { request } from "@/shared/api/http";
import type { ApiResponse, K8sListQueryParams } from "@/types/api";
import type { InfoPod, InfoK8sPodPatchRequest } from "./dto";

const BASE_URL = `${INFO_BASE}/k8s/pods`;

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

