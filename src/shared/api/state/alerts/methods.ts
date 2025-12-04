import { SYSTEM_BASE } from "@/shared/api/base";
import { request } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";

// --- DTO TYPES ---
export interface AlertEvent {
  id: string;
  message: string;
  severity: string;
  created_at: string; // ISO datetime
  last_updated_at: string; // ISO datetime
  active: boolean;
}

/** You return: { data: AlertEvent[] } */
export type AlertsResponse = AlertEvent[];

// --- API URL ---
const ALERTS_URL = `${SYSTEM_BASE}/states/alerts`;

// --- API CALL ---
export const fetchActiveAlerts = () =>
  request<ApiResponse<AlertsResponse>>({
    method: "GET",
    url: ALERTS_URL,
  });
