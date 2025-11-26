import type { LanguageCode, LanguageOption } from "@/types/i18n";

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
];

export const SUPPORTED_LANGUAGES: readonly LanguageCode[] =
  LANGUAGE_OPTIONS.map((option) => option.code);

export const isLanguageCode = (value?: string | null): value is LanguageCode =>
  !!value && SUPPORTED_LANGUAGES.includes(value as LanguageCode);

export const normalizeLanguageCode = (value?: string | null): LanguageCode =>
  isLanguageCode(value) ? value : DEFAULT_LANGUAGE;

export const buildLanguagePrefix = (value?: string | null): string =>
  `/${normalizeLanguageCode(value)}`;

export const replaceLanguageInPath = (
  pathname: string,
  nextLanguage: LanguageCode
): string => {
  if (!pathname.startsWith("/")) {
    return buildLanguagePrefix(nextLanguage);
  }

  const segments = pathname.split("/");
  segments[1] = nextLanguage;

  const candidate = segments.join("/");
  return candidate === "" ? buildLanguagePrefix(nextLanguage) : candidate;
};
