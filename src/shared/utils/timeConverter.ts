interface DateParts {
  year?: string;
  month?: string;
  day?: string;
  hour?: string;
  minute?: string;
  second?: string;
}

export function getTimestampInZone(iso: string, timeZone: string): number {
  const date = new Date(iso);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const partsArray = formatter.formatToParts(date);
  const parts: DateParts = {};

  for (const p of partsArray) {
    if (p.type !== "literal") {
      parts[p.type as keyof DateParts] = p.value;
    }
  }

  return Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
}

export function toUTC(localIso: string, timezone: string): string {
  const ts = getTimestampInZone(localIso, timezone);
  return new Date(ts).toISOString();
}

export function fromUTC(utcIso: string, timezone: string): string {
  return new Date(utcIso)
    .toLocaleString("sv-SE", {
      timeZone: timezone,
      hour12: false,
    })
    .replace(" ", "T");
}

export function isTimeField(key: string): boolean {
  return /(^|\b)(time|timestamp|date|createdAt|updatedAt|start|end|expires|expiry)(\b|$)/i.test(
    key
  );
}
