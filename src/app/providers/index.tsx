import { type ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { I18nProvider } from "./I18nProvider";
import { QueryProvider } from "./QueryProvider";

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>
    <I18nProvider>
      <QueryProvider>{children}</QueryProvider>
    </I18nProvider>
  </ThemeProvider>
);
