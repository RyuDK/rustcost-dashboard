import { INFO_BASE } from "@/shared/api/base";
import { request } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";
import type { MutationResponse } from "@/types/info";
import type { InfoAlertEntity, InfoAlertUpsertRequest } from "./dto";

const ALERTS_URL = `${INFO_BASE}/alerts`;

export const fetchInfoAlerts = () =>
  request<ApiResponse<InfoAlertEntity>>({
    method: "GET",
    url: ALERTS_URL,
  });

export const upsertInfoAlerts = (payload: InfoAlertUpsertRequest) =>
  request<ApiResponse<MutationResponse>>({
    method: "PUT",
    url: ALERTS_URL,
    data: payload,
  });
