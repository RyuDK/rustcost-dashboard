export function isLessThan3Hours(iso: string): boolean {
  const now = Date.now();
  const ts = new Date(iso).getTime();

  const diffHours = (now - ts) / (1000 * 60 * 60);
  return diffHours < 3;
}

/**
 * Detect whether an object key represents a timestamp or date-like field.
 * This is used by normalizeRequest / normalizeResponse to decide when to
 * convert time values toUTC() / fromUTC().
 */
export function isTimeField(key: string): boolean {
  return /(^|\b)(time|timestamp|date|createdAt|updatedAt|start|end|expires|expiry)(\b|$)/i.test(
    key
  );
}
