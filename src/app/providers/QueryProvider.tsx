import { type ReactNode, useMemo, useRef } from "react";
import { QueryClientContext } from "./queryContext";
import { SimpleQueryClient } from "./queryClient";

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
