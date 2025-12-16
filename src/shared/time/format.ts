import { DEFAULT_TIMEZONE, getGmtLabelFromTimezone } from "./timezone";

export type DateInput = Date | number | string;

export const DATE_TIME_SHORT = "YYYY-MM-DD HH:mm";

type DateTimePattern = typeof DATE_TIME_SHORT;

type DateParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second?: string;
  timeZoneName?: string;
};

export type FormatDateTimeOptions = {
  timeZone?: string;
  pattern?: DateTimePattern;
  withGmtOffset?: boolean;
};

const buildFormatter = (timeZone?: string) => {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || DEFAULT_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZoneName: "shortOffset",
    });
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZoneName: "shortOffset",
    });
  }
};

const getDateParts = (value: Date, timeZone?: string): DateParts => {
  const formatter = buildFormatter(timeZone);

  const parts = formatter.formatToParts(value);
  return parts.reduce<DateParts>(
    (acc, part) => {
      if (part.type === "literal") return acc;
      if (part.type === "timeZoneName") {
        acc.timeZoneName = part.value;
        return acc;
      }

      acc[part.type as keyof DateParts] = part.value;
      return acc;
    },
    {
      year: "",
      month: "",
      day: "",
      hour: "",
      minute: "",
    }
  );
};

const applyPattern = (pattern: DateTimePattern, parts: DateParts): string => {
  const base = String(pattern); // <- widen
  const tokens = {
    YYYY: parts.year,
    MM: parts.month,
    DD: parts.day,
    HH: parts.hour,
    mm: parts.minute,
  } satisfies Record<string, string | undefined>;

  return Object.entries(tokens).reduce(
    (acc, [token, value]) => acc.replace(new RegExp(token, "g"), value ?? ""),
    base
  );
};

const toDate = (value: DateInput): Date | null => {
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;

  const date =
    typeof value === "number" ? new Date(value) : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateTime = (
  value: DateInput,
  options: FormatDateTimeOptions = {}
): string => {
  const date = toDate(value);
  if (!date) return "";

  const pattern = options.pattern ?? DATE_TIME_SHORT;
  const parts = getDateParts(date, options.timeZone);
  const base = applyPattern(pattern, parts);

  if (options.withGmtOffset) {
    const label =
      parts.timeZoneName ??
      getGmtLabelFromTimezone(options.timeZone ?? DEFAULT_TIMEZONE);
    return `${base} (${label})`;
  }

  return base;
};

export const formatDateTimeWithGmt = (
  value: DateInput,
  options: Omit<FormatDateTimeOptions, "withGmtOffset"> = {}
): string => formatDateTime(value, { ...options, withGmtOffset: true });
