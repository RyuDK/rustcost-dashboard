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
