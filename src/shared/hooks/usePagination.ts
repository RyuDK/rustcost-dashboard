import { useCallback, useState } from "react";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../api/constants";

export interface PaginationState {
  limit: number;
  offset: number;
}

/**
 * Convenience hook for offset-based pagination state.
 *
 * @param initial - Optional initial offset/limit overrides.
 */
export const usePagination = (initial?: Partial<PaginationState>) => {
  const [limit, setLimit] = useState<number>(
    initial?.limit ?? DEFAULT_PAGE_SIZE
  );
  const [offset, setOffset] = useState<number>(initial?.offset ?? 0);

  const updateLimit = useCallback((next: number) => {
    const value = Math.min(Math.max(next, 1), MAX_PAGE_SIZE);
    setLimit(value);
    setOffset(0);
  }, []);

  const nextPage = useCallback(() => {
    setOffset((prev) => prev + limit);
  }, [limit]);

  const prevPage = useCallback(() => {
    setOffset((prev) => Math.max(prev - limit, 0));
  }, [limit]);

  const reset = useCallback(() => {
    setOffset(0);
    setLimit(initial?.limit ?? DEFAULT_PAGE_SIZE);
  }, [initial?.limit]);

  return {
    limit,
    offset,
    nextPage,
    prevPage,
    updateLimit,
    reset,
  };
};
