import { useCallback, useState } from "react";
import { systemApi } from "@/shared/api";
import type { ApiResponse } from "@/types/api";
import type { ResyncResponse } from "@/types/system";

export const useSystemResync = () => {
  const [data, setData] = useState<ApiResponse<ResyncResponse> | undefined>();
  const [error, setError] = useState<unknown>();
  const [isLoading, setIsLoading] = useState(false);

  const trigger = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const response = await systemApi.triggerSystemResync();
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

