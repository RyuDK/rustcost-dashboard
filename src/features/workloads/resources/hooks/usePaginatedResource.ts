import { useCallback, useEffect, useState } from "react";
import type { PaginationParams } from "@/shared/api/http";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export const formatAge = (timestamp?: string) => {
  if (!timestamp) {
    return "n/a";
  }
  const created = Date.parse(timestamp);
  if (Number.isNaN(created)) {
    return "n/a";
  }
  const diffMs = Date.now() - created;
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 48) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

type PaginatedFetcher<T> = (
  params: PaginationParams
) => Promise<ApiResponse<PaginatedResponse<T>>>;

export const usePaginatedResource = <T>(
  fetcher: PaginatedFetcher<T>,
  getId: (item: T) => string,
  deps: unknown[] = []
) => {
  const [items, setItems] = useState<T[]>([]);
  const [selected, setSelected] = useState<T | null>(null);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetcher({ limit: pageSize, offset });

      if (!res.is_successful) {
        throw new Error(res.error_msg ?? "Failed to load resources");
      }

      const page = res.data;
      const pageItems = page?.items ?? [];
      setItems(pageItems);
      setTotal(page?.total ?? pageItems.length);

      const ids = new Set(pageItems.map(getId));
      setSelected((prev) => {
        if (prev && ids.has(getId(prev))) {
          return prev;
        }
        return pageItems[0] ?? null;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to fetch resources"
      );
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, getId, offset, pageSize, ...deps]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    items,
    selected,
    setSelected,
    pageSize,
    setPageSize,
    offset,
    setOffset,
    total,
    isLoading,
    error,
    reload: load,
  };
};
