import { createContext, useContext } from "react";
import type { SimpleQueryClient } from "./queryClient";

export const QueryClientContext = createContext<SimpleQueryClient | null>(null);

export const useQueryClient = () => {
  const client = useContext(QueryClientContext);
  if (!client) {
    throw new Error("useQueryClient must be used within QueryProvider");
  }
  return client;
};
