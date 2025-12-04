import { ThemeProvider } from "./ThemeProvider";
import { QueryProvider } from "./QueryProvider";
import { Provider as ReduxProvider } from "react-redux";
import { store as appStore } from "@/store/store";
import type { ReactNode } from "react";

export interface AppProvidersProps {
  children: ReactNode;
  store?: typeof appStore;
}

export function AppProviders({
  children,
  store = appStore,
}: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <ReduxProvider store={store}>{children}</ReduxProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
