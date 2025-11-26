import { systemApi } from "@/shared/api";
import { useFetch } from "@/shared/hooks/useFetch";
import type { ApiResponse } from "@/types/api";
import type { UseFetchOptions } from "@/types/fetch";
import type { SystemStatusResponse } from "@/types/system";

export const useSystemStatus = (options?: UseFetchOptions) =>
  useFetch<ApiResponse<SystemStatusResponse>>(
    JSON.stringify({ scope: "system", resource: "status" }),
    () => systemApi.fetchSystemStatus(),
    options
  );
