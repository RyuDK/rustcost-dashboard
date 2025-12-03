export function isLessThan3Hours(iso: string): boolean {
  const now = Date.now();
  const ts = new Date(iso).getTime();

  const diffHours = (now - ts) / (1000 * 60 * 60);
  return diffHours < 3;
}
