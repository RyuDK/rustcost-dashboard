import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LANGUAGE_OPTIONS,
  normalizeLanguageCode,
  replaceLanguageInPath,
} from "@/constants/language";
import type { LanguageCode } from "@/types/i18n";
import type { UseI18nResult } from "./I18nContext";

export const useI18n = (): UseI18nResult => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const language = normalizeLanguageCode(
    i18n.language ?? i18n.resolvedLanguage
  );

  const setLanguage = (next: LanguageCode) => {
    const normalized = normalizeLanguageCode(next);
    const nextPath = replaceLanguageInPath(location.pathname, normalized);
    const fullPath = `${nextPath}${location.search ?? ""}${
      location.hash ?? ""
    }`;
    navigate(fullPath, { replace: true });
  };

  return {
    t,
    language,
    setLanguage,
    languageOptions: LANGUAGE_OPTIONS,
  };
};
