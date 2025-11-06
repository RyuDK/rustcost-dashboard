import {
  type ReactNode,
  createContext,
  useContext,
  useMemo,
  useRef,
} from "react";

type Fetcher<T> = () => Promise<T>;

interface QueryState<T> {
  data?: T;
  error?: unknown;
  promise?: Promise<T>;
  updatedAt?: number;
}

interface FetchOptions {
  staleTime?: number;
}

class SimpleQueryClient {
  private cache = new Map<string, QueryState<unknown>>();

  async fetchQuery<T>(
    key: string,
    fetcher: Fetcher<T>,
    options: FetchOptions = {}
  ): Promise<T> {
    const current = this.cache.get(key) as QueryState<T> | undefined;
    const now = Date.now();

    if (
      current?.data !== undefined &&
      current.updatedAt &&
      options.staleTime &&
      now - current.updatedAt < options.staleTime
    ) {
      return current.data;
    }

    if (current?.promise) {
      return current.promise;
    }

    const promise = fetcher()
      .then((data) => {
        this.cache.set(key, { data, updatedAt: Date.now() });
        return data;
      })
      .catch((error) => {
        this.cache.set(key, { error, updatedAt: Date.now() });
        throw error;
      })
      .finally(() => {
        const cached = this.cache.get(key);
        if (cached?.promise) {
          delete cached.promise;
          this.cache.set(key, cached);
        }
      });

    this.cache.set(key, { ...current, promise });
    return promise;
  }

  getQueryData<T>(key: string): T | undefined {
    return this.cache.get(key)?.data as T | undefined;
  }

  getQueryError(key: string): unknown {
    return this.cache.get(key)?.error;
  }

  invalidateQuery(key?: string) {
    if (key) {
      this.cache.delete(key);
      return;
    }
    this.cache.clear();
  }
}

const QueryClientContext = createContext<SimpleQueryClient | null>(null);

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  const clientRef = useRef<SimpleQueryClient>();
  if (!clientRef.current) {
    clientRef.current = new SimpleQueryClient();
  }
  const value = useMemo(() => clientRef.current!, []);

  return (
    <QueryClientContext.Provider value={value}>
      {children}
    </QueryClientContext.Provider>
  );
};

export const useQueryClient = () => {
  const client = useContext(QueryClientContext);
  if (!client) {
    throw new Error("useQueryClient must be used within QueryProvider");
  }
  return client;
};
