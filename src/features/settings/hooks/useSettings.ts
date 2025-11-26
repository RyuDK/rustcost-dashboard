import { infoApi } from "@/shared/api";
import { useFetch } from "@/shared/hooks/useFetch";
import type { ApiResponse } from "@/types/api";
import type { UseFetchOptions } from "@/types/fetch";
import type { InfoSetting } from "@/shared/api/info";

const SETTINGS_KEY = JSON.stringify({ scope: "info", resource: "settings" });

export const useSettings = (options?: UseFetchOptions) =>
  useFetch<ApiResponse<InfoSetting>>(
    SETTINGS_KEY,
    () => infoApi.fetchInfoSettings(),
    options
  );

