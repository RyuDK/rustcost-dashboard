import { INFO_BASE } from "@/shared/api/base";
import { request } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";
import type { InfoLlmEntity, InfoLlmUpsertRequest } from "./dto";

const LLM_URL = `${INFO_BASE}/llm`;

export const fetchInfoLlm = () =>
  request<ApiResponse<InfoLlmEntity>>({
    method: "GET",
    url: LLM_URL,
  });

export const upsertInfoLlm = (payload: InfoLlmUpsertRequest) =>
  request<ApiResponse<{ message?: string } | null>>({
    method: "PUT",
    url: LLM_URL,
    data: payload,
  });
