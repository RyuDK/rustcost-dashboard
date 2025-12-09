import { API_BASE } from "@/shared/api/base";
import { request } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";
import type { AlertsPayload, ResolveAlertPayload } from "./dto";

const ALERTS_URL = `${API_BASE}/states/alerts`;

export const fetchActiveAlerts = () =>
  request<ApiResponse<AlertsPayload>>({
    method: "GET",
    url: ALERTS_URL,
  });

export const resolveAlert = (id: string) =>
  request<ApiResponse<ResolveAlertPayload>>({
    method: "POST",
    url: `${ALERTS_URL}/resolve/${id}`,
  });
