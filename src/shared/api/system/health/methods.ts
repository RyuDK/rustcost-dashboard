import { SYSTEM_BASE, type ApiResponse } from "../../base";
import { request } from "../../http";
import type { SystemResponse } from "./dto";

const HEALTH_URL = `${SYSTEM_BASE}/health`;

export const fetchSystemHealth = () =>
  request<ApiResponse<SystemResponse>>({
    method: "GET",
    url: HEALTH_URL,
  });

