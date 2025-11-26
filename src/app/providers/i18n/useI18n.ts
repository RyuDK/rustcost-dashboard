import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGE_OPTIONS } from "@/constants/language";
import { I18nContext } from "./I18nContext";
import type { UseI18nResult } from "./I18nContext";

export const useI18n = (): UseI18nResult => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  const { t } = useTranslation();
  return {
    t,
    language: ctx.language,
    setLanguage: ctx.setLanguage,
    languageOptions: LANGUAGE_OPTIONS,
  };
};
