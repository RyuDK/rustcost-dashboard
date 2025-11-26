import { SYSTEM_BASE } from "@/shared/api/base";
import { request } from "@/shared/api/http";
import type { ApiResponse } from "@/types/api";
import type { BackupResponse } from "./dto";

const BACKUP_URL = `${SYSTEM_BASE}/backup`;

export const triggerSystemBackup = () =>
  request<ApiResponse<BackupResponse>>({
    method: "POST",
    url: BACKUP_URL,
  });

