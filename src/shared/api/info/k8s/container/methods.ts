import {
  INFO_BASE,
  encode,
  buildK8sListQuery,
} from "@/shared/api/base";
import { request } from "@/shared/api/http";
import type { ApiResponse, K8sListQueryParams } from "@/types/api";
import type {
  InfoContainer,
  InfoK8sContainerPatchRequest,
} from "./dto";

const BASE_URL = `${INFO_BASE}/k8s/store/containers`;

export const fetchInfoK8sContainers = (params?: K8sListQueryParams) =>
  request<ApiResponse<InfoContainer[]>>({
    method: "GET",
    url: BASE_URL,
    params: buildK8sListQuery(params),
  });

export const getInfoK8sContainer = (containerId: string) =>
  request<ApiResponse<InfoContainer>>({
    method: "GET",
    url: `${BASE_URL}/${encode(containerId)}`,
  });

export const patchInfoK8sContainer = (
  containerId: string,
  payload: InfoK8sContainerPatchRequest
) =>
  request<ApiResponse<InfoContainer>>({
    method: "PATCH",
    url: `${BASE_URL}/${encode(containerId)}`,
    data: payload,
  });
