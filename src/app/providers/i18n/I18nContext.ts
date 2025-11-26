import { createContext } from "react";
import type { TFunction } from "i18next";
import { LANGUAGE_OPTIONS } from "@/constants/language";
import type { LanguageCode } from "@/types/i18n";

export type I18nContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
};

export type UseI18nResult = {
  t: TFunction<"translation", undefined>;
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  languageOptions: typeof LANGUAGE_OPTIONS;
};

export const I18nContext = createContext<I18nContextValue | null>(null);
