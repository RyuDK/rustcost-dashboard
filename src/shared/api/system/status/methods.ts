import { SYSTEM_BASE, type ApiResponse } from "@/shared/api/base";
import { request } from "@/shared/api/http";
import type { SystemStatusResponse } from "./dto";

const STATUS_URL = `${SYSTEM_BASE}/status`;

export const fetchSystemStatus = () =>
  request<ApiResponse<SystemStatusResponse>>({
    method: "GET",
    url: STATUS_URL,
  });

