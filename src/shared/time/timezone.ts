import { useAppSelector } from "@/store/hook";

export const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

const getFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    timeZoneName: "shortOffset",
  });

export const getGmtLabelFromTimezone = (timeZone?: string): string => {
  const target = timeZone || DEFAULT_TIMEZONE;
  try {
    const parts = getFormatter(target).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    const fallbackParts = getFormatter(DEFAULT_TIMEZONE).formatToParts(new Date());
    return fallbackParts.find((p) => p.type === "timeZoneName")?.value ?? "";
  }
};

export const useTimezone = () => {
  const selected = useAppSelector((state) => state.preferences.timezone);
  const fallback = DEFAULT_TIMEZONE;

  return {
    timeZone: selected || fallback,
    selectedTimeZone: selected,
    fallbackTimeZone: fallback,
  };
};
