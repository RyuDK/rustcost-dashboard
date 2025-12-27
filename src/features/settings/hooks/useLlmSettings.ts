import { infoApi } from "@/shared/api";
import { useFetch } from "@/shared/hooks/useFetch";
import type { ApiResponse } from "@/types/api";
import type { UseFetchOptions } from "@/types/fetch";
import type { InfoLlmEntity } from "@/shared/api/info";

const LLM_SETTINGS_KEY = JSON.stringify({ scope: "info", resource: "llm" });

export const useLlmSettings = (options?: UseFetchOptions) =>
  useFetch<ApiResponse<InfoLlmEntity>>(
    LLM_SETTINGS_KEY,
    () => infoApi.fetchInfoLlm(),
    options
  );
