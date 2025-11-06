import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  SUPPORTED_LANGUAGES,
  defaultLanguage,
  getDictionary,
  type LanguageCode,
  type TranslationKey,
} from "../../i18n/i18n";

interface I18nContextValue {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: TranslationKey) => string;
}

const I18N_STORAGE_KEY = "rustcost_language";

const I18nContext = createContext<I18nContextValue | null>(null);

const readInitialLanguage = (): LanguageCode => {
  if (typeof window === "undefined") {
    return defaultLanguage;
  }
  const stored = window.localStorage.getItem(I18N_STORAGE_KEY);
  if (stored && SUPPORTED_LANGUAGES.includes(stored as LanguageCode)) {
    return stored as LanguageCode;
  }
  return defaultLanguage;
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageCode>(
    readInitialLanguage
  );

  useEffect(() => {
    window.localStorage.setItem(I18N_STORAGE_KEY, language);
  }, [language]);

  const dictionary = useMemo(() => getDictionary(language), [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: (key: TranslationKey) => dictionary[key] ?? key,
    }),
    [dictionary, language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
};
