import { SYSTEM_BASE } from "@/shared/api/base";
import { request } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";
import type { LogFileListResponse } from "./dto";
import type { LogLineResponse } from "./dto";

const LOGS_URL = `${SYSTEM_BASE}/log-files`;

export const getSystemLogFileList = () =>
  request<ApiResponse<LogFileListResponse>>({
    method: "GET",
    url: LOGS_URL,
  });

export const getSystemLogLines = (
  date: string,
  cursor: number = 0,
  limit: number = 100
) =>
  request<ApiResponse<LogLineResponse>>({
    method: "GET",
    url: `${LOGS_URL}/${encodeURIComponent(date)}`,
    params: { cursor, limit },
  });
