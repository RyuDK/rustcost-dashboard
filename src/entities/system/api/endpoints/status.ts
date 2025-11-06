import { request } from "../../../../shared/api/http";
import { API_BASE_PATH } from "../../../../shared/api/constants";
import { useFetch, type UseFetchOptions } from "../../../../shared/hooks/useFetch";
import type { SystemStatusResponse } from "../types";

const STATUS_URL = `${API_BASE_PATH}/system/status`;

/**
 * Retrieves the latest health information for the RustCost control plane.
 */
export const fetchSystemStatus = () =>
  request<SystemStatusResponse>({
    method: "GET",
    url: STATUS_URL,
  });

/**
 * Hook that subscribes to system status updates with caching.
 */
export const useSystemStatus = (options?: UseFetchOptions) =>
  useFetch<SystemStatusResponse>(
    JSON.stringify({ scope: "system", resource: "status" }),
    fetchSystemStatus,
    options
  );
