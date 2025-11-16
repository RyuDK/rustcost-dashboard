import { SYSTEM_BASE, type ApiResponse } from "../../base";
import { request } from "../../http";
import type { BackupResponse } from "./dto";

const BACKUP_URL = `${SYSTEM_BASE}/backup`;

export const triggerSystemBackup = () =>
  request<ApiResponse<BackupResponse>>({
    method: "POST",
    url: BACKUP_URL,
  });

