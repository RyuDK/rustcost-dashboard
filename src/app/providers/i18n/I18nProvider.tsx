import { useEffect, useMemo, useState, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n/i18n";
import {
  SUPPORTED_LANGUAGES,
  normalizeLanguageCode,
} from "@/constants/language";
import type { LanguageCode } from "@/types/i18n";
import { I18nContext, type I18nContextValue } from "./I18nContext";

const I18N_STORAGE_KEY = "rustcost_language";

const readStoredLanguage = (): LanguageCode | null => {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(I18N_STORAGE_KEY);
  return stored && SUPPORTED_LANGUAGES.includes(stored as LanguageCode)
    ? (stored as LanguageCode)
    : null;
};

const resolveInitialLanguage = (): LanguageCode => {
  const stored = readStoredLanguage();
  if (stored) return stored;

  const detected = i18n.language ?? i18n.resolvedLanguage;
  return normalizeLanguageCode(detected);
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageCode>(
    resolveInitialLanguage
  );
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    const syncFromI18n = (nextLanguage?: string) =>
      setLanguageState((prev) => {
        const normalized = normalizeLanguageCode(
          nextLanguage ?? i18n.language ?? i18n.resolvedLanguage
        );
        setIsSynced(true);
        return prev === normalized ? prev : normalized;
      });

    syncFromI18n();

    const handleLanguageChanged = (nextLanguage: string) =>
      syncFromI18n(nextLanguage);
    i18n.on("languageChanged", handleLanguageChanged);

    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  useEffect(() => {
    if (!isSynced) return;

    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(I18N_STORAGE_KEY, language);
    }
  }, [isSynced, language]);

  const setLanguage = (next: LanguageCode) =>
    setLanguageState(normalizeLanguageCode(next));

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
    }),
    [language]
  );

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
    </I18nextProvider>
  );
};
