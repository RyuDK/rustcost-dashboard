import { useCallback, useState } from "react";
import { request } from "../../../../shared/api/http";
import { API_BASE_PATH } from "../../../../shared/api/constants";
import type { BackupResponse } from "../types";

const BACKUP_URL = `${API_BASE_PATH}/system/backup`;

export interface BackupPayload {
  mode?: "full" | "incremental";
  includeMetrics?: boolean;
}

/**
 * Requests a system backup operation.
 *
 * @param payload - Optional parameters to adjust backup behavior.
 */
export const triggerSystemBackup = (payload?: BackupPayload) =>
  request<BackupResponse>({
    method: "POST",
    url: BACKUP_URL,
    data: payload ?? {},
  });

/**
 * Hook returning a trigger function and state for system backup actions.
 */
export const useSystemBackup = () => {
  const [data, setData] = useState<BackupResponse | undefined>();
  const [error, setError] = useState<unknown>();
  const [isLoading, setIsLoading] = useState(false);

  const trigger = useCallback(async (payload?: BackupPayload) => {
    setIsLoading(true);
    setError(undefined);
    try {
      const response = await triggerSystemBackup(payload);
      setData(response);
      return response;
    } catch (err) {
      setError(err);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { trigger, data, error, isLoading };
};
