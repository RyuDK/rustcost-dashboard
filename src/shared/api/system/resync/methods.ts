import { SYSTEM_BASE } from "@/shared/api/base";
import { request } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";
import type { ResyncResponse } from "./dto";

const RESYNC_URL = `${SYSTEM_BASE}/resync`;

export const postSystemResync = () =>
  request<ApiResponse<ResyncResponse>>({
    method: "POST",
    url: RESYNC_URL,
  });
