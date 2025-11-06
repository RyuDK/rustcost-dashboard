import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "../../app/providers/QueryProvider";

export interface UseFetchOptions {
  enabled?: boolean;
  /**
   * Query stale time in milliseconds.
   */
  staleTime?: number;
  /**
   * Arbitrary dependencies that should trigger refetch.
   */
  deps?: readonly unknown[];
}

export interface UseFetchResult<T> {
  data?: T;
  error?: unknown;
  isLoading: boolean;
  refetch: () => Promise<T | undefined>;
}

const serializeKey = (key: string | readonly unknown[]): string =>
  Array.isArray(key) ? JSON.stringify(key) : key;

/**
 * Lightweight data-fetching hook with memoized cache support.
 *
 * @param key - Unique key string or tuple used for caching.
 * @param fetcher - Promise-returning function that resolves data.
 * @param options - Optional configuration (enabled flag, stale time, deps).
 */
export const useFetch = <T>(
  key: string | readonly unknown[],
  fetcher: () => Promise<T>,
  options: UseFetchOptions = {}
): UseFetchResult<T> => {
  const queryClient = useQueryClient();
  const { enabled = true, deps = [], staleTime = 30_000 } = options;
  const cacheKey = useMemo(() => serializeKey(key), [key]);
  const [data, setData] = useState<T | undefined>(() =>
    queryClient.getQueryData<T>(cacheKey)
  );
  const [error, setError] = useState<unknown>(() =>
    enabled ? queryClient.getQueryError(cacheKey) : undefined
  );
  const [isLoading, setLoading] = useState<boolean>(enabled && !data);

  const execute = useCallback(async () => {
    if (!enabled) {
      return data;
    }
    setLoading(true);
    try {
      const result = await queryClient.fetchQuery(
        cacheKey,
        fetcher,
        { staleTime }
      );
      setData(result);
      setError(undefined);
      return result;
    } catch (err) {
      setError(err);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [cacheKey, data, enabled, fetcher, queryClient, staleTime]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (data) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const result = await queryClient.fetchQuery(
          cacheKey,
          fetcher,
          { staleTime }
        );
        if (!cancelled) {
          setData(result);
          setError(undefined);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, enabled, staleTime, ...deps]);

  const refetch = useCallback(async () => {
    queryClient.invalidateQuery(cacheKey);
    return execute();
  }, [cacheKey, execute, queryClient]);

  return { data, error, isLoading, refetch };
};
