import { INFO_BASE } from "@/shared/api/base";
import { request } from "@/shared/api/http";
import type { ApiResponse } from "@/shared/api/base";
import type { MutationResponse } from "@/shared/api/info/types";
import type { InfoSetting, InfoSettingUpsertRequest } from "./dto";

const SETTINGS_URL = `${INFO_BASE}/settings`;

export const fetchInfoSettings = () =>
  request<ApiResponse<InfoSetting>>({
    method: "GET",
    url: SETTINGS_URL,
  });

export const upsertInfoSettings = (payload: InfoSettingUpsertRequest) =>
  request<ApiResponse<MutationResponse>>({
    method: "PUT",
    url: SETTINGS_URL,
    data: payload,
  });

