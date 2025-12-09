import { API_BASE } from "@/shared/api/base";
import { request } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";
import type { K8sRuntimeState } from "./dto";

const K8S_URL = `${API_BASE}/states/k8s`;

export const fetchK8sRuntimeState = () =>
  request<ApiResponse<K8sRuntimeState>>({
    method: "GET",
    url: K8S_URL,
  });
