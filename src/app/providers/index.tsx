import { ThemeProvider } from "./ThemeProvider";
import { I18nProvider } from "./I18nProvider";
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
      <I18nProvider>
        <QueryProvider>
          <ReduxProvider store={store}>{children}</ReduxProvider>
        </QueryProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
