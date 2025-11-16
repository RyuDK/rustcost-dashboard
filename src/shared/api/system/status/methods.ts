import { SYSTEM_BASE, type ApiResponse } from "../../base";
import { request } from "../../http";
import type { SystemStatusResponse } from "./dto";

const STATUS_URL = `${SYSTEM_BASE}/status`;

export const fetchSystemStatus = () =>
  request<ApiResponse<SystemStatusResponse>>({
    method: "GET",
    url: STATUS_URL,
  });

