import { systemApi } from "@/shared/api";
import type { ApiResponse } from "@/shared/api/base";
import type { SystemStatusResponse } from "@/shared/api/system";
import { useFetch, type UseFetchOptions } from "@/shared/hooks/useFetch";

export const useSystemStatus = (options?: UseFetchOptions) =>
  useFetch<ApiResponse<SystemStatusResponse>>(
    JSON.stringify({ scope: "system", resource: "status" }),
    () => systemApi.fetchSystemStatus(),
    options
  );
