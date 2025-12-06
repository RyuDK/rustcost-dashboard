type DatePart = "year" | "month" | "day" | "hour" | "minute" | "second";

interface ParsedIso {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  offsetMinutes?: number;
}

const DATE_PARTS: DatePart[] = ["year", "month", "day", "hour", "minute", "second"];
const isoPattern =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):?(\d{2}))?$/;
const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  formatterCache.set(timeZone, formatter);
  return formatter;
}

function parseIso(iso: string): ParsedIso | null {
  const match = isoPattern.exec(iso);
  if (!match) return null;

  const [, year, month, day, hour, minute, second, sign, offsetHour, offsetMinute] = match;
  let offsetMinutes: number | undefined;

  if (sign && offsetHour && offsetMinute) {
    const baseOffset = Number(offsetHour) * 60 + Number(offsetMinute);
    offsetMinutes = sign === "-" ? -baseOffset : baseOffset;
  } else if (/Z$/i.test(iso)) {
    offsetMinutes = 0;
  }

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
    offsetMinutes,
  };
}

function pad(value: number, length: number): string {
  return value.toString().padStart(length, "0");
}

function formatDateParts(parts: Record<DatePart, number>): string {
  return `${pad(parts.year, 4)}-${pad(parts.month, 2)}-${pad(parts.day, 2)}T${pad(
    parts.hour,
    2
  )}:${pad(parts.minute, 2)}:${pad(parts.second, 2)}`;
}

function formatUTC(timestamp: number): string {
  const date = new Date(timestamp);
  return formatDateParts({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
  });
}

function extractZonedParts(timestamp: number, timeZone: string): Record<DatePart, number> {
  const formatter = getFormatter(timeZone);
  const partsArray = formatter.formatToParts(new Date(timestamp));
  const parts: Partial<Record<DatePart, number>> = {};

  for (const part of partsArray) {
    if (DATE_PARTS.includes(part.type as DatePart)) {
      parts[part.type as DatePart] = Number(part.value);
    }
  }

  return {
    year: parts.year ?? 0,
    month: parts.month ?? 1,
    day: parts.day ?? 1,
    hour: parts.hour ?? 0,
    minute: parts.minute ?? 0,
    second: parts.second ?? 0,
  };
}

function getTimeZoneOffset(timestamp: number, timeZone: string): number {
  const zoned = extractZonedParts(timestamp, timeZone);
  const asUTC = Date.UTC(
    zoned.year,
    zoned.month - 1,
    zoned.day,
    zoned.hour,
    zoned.minute,
    zoned.second
  );
  return asUTC - timestamp;
}

function formatInTimeZone(timestamp: number, timeZone: string): string {
  const parts = extractZonedParts(timestamp, timeZone);
  return formatDateParts(parts);
}

export function toUTC(localIso: string, timeZone: string): string {
  const parsed = parseIso(localIso);
  if (!parsed) return localIso;

  const baseUtc = Date.UTC(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    parsed.hour,
    parsed.minute,
    parsed.second
  );

  if (parsed.offsetMinutes !== undefined) {
    const timestamp = baseUtc - parsed.offsetMinutes * 60 * 1000;
    return formatUTC(timestamp);
  }

  const offset = getTimeZoneOffset(baseUtc, timeZone);
  let timestamp = baseUtc - offset;
  const adjustedOffset = getTimeZoneOffset(timestamp, timeZone);

  if (adjustedOffset !== offset) {
    timestamp = baseUtc - adjustedOffset;
  }

  return formatUTC(timestamp);
}

export function fromUTC(utcIso: string, timeZone: string): string {
  const parsed = parseIso(utcIso);
  if (!parsed) return utcIso;

  const baseUtc = Date.UTC(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    parsed.hour,
    parsed.minute,
    parsed.second
  );
  const timestamp =
    parsed.offsetMinutes !== undefined
      ? baseUtc - parsed.offsetMinutes * 60 * 1000
      : baseUtc;

  return formatInTimeZone(timestamp, timeZone);
}

export function toUTCDateBoundary(
  localDate: string,
  timeZone: string,
  boundary: "start" | "end" = "start"
): string {
  if (!dateOnlyPattern.test(localDate)) return localDate;

  const time =
    boundary === "end"
      ? "T23:59:59"
      : "T00:00:00";
  return toUTC(`${localDate}${time}`, timeZone);
}
