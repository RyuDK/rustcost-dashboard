import { infoApi } from "@/shared/api";
import type { ApiResponse } from "@/shared/api/base";
import type { InfoSetting } from "@/shared/api/info";
import { useFetch, type UseFetchOptions } from "@/shared/hooks/useFetch";

const SETTINGS_KEY = JSON.stringify({ scope: "info", resource: "settings" });

export const useSettings = (options?: UseFetchOptions) =>
  useFetch<ApiResponse<InfoSetting>>(
    SETTINGS_KEY,
    () => infoApi.fetchInfoSettings(),
    options
  );

