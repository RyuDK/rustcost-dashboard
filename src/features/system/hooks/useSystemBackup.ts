import { useCallback, useState } from "react";
import { systemApi } from "@/shared/api";
import type { ApiResponse } from "@/types/api";
import type { BackupResponse } from "@/types/system";

export const useSystemBackup = () => {
  const [data, setData] = useState<ApiResponse<BackupResponse> | undefined>();
  const [error, setError] = useState<unknown>();
  const [isLoading, setIsLoading] = useState(false);

  const trigger = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const response = await systemApi.triggerSystemBackup();
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

