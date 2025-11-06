import en from "./locales/en.json";
import ko from "./locales/ko.json";

export const SUPPORTED_LANGUAGES = ["en", "ko"] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

export type TranslationKey = keyof typeof en;

type TranslationDictionary = Record<LanguageCode, Record<string, string>>;

const translations: TranslationDictionary = {
  en,
  ko,
};

export const defaultLanguage: LanguageCode = "en";

export const getTranslation = (
  key: TranslationKey,
  language: LanguageCode = defaultLanguage
): string => translations[language]?.[key] ?? key;

export const hasTranslation = (
  key: string,
  language: LanguageCode = defaultLanguage
): boolean => Boolean(translations[language]?.[key]);

export const getDictionary = (language: LanguageCode) => translations[language];
