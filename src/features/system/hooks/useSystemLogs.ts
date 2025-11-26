import { useCallback, useState } from "react";
import { systemApi } from "@/shared/api";
import type { ApiResponse } from "@/shared/api/base";
import type { LogFileListResponse } from "@/shared/api/system";

export const useSystemLogFileList = () => {
  const [data, setData] = useState<
    ApiResponse<LogFileListResponse> | undefined
  >();
  const [error, setError] = useState<unknown>();
  const [isLoading, setIsLoading] = useState(false);

  const trigger = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const response = await systemApi.getSystemLogFileList();
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
