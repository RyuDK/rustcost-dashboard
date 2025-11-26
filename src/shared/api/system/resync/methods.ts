import { SYSTEM_BASE, type ApiResponse } from "@/shared/api/base";
import { request } from "@/shared/api/http";
import type { ResyncResponse } from "./dto";

const RESYNC_URL = `${SYSTEM_BASE}/resync`;

export const triggerSystemResync = () =>
  request<ApiResponse<ResyncResponse>>({
    method: "POST",
    url: RESYNC_URL,
  });

