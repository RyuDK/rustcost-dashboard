export const toIsoDate = (date: Date) => date.toISOString().split("T")[0];

export const subtractDays = (date: Date, days: number) => {
  const clone = new Date(date);
  clone.setDate(clone.getDate() - days);
  return clone;
};

export const getDefaultDateRange = (days = 7) => {
  const end = new Date();
  const start = subtractDays(end, days);
  return { start: toIsoDate(start), end: toIsoDate(end) };
};

export const formatDateTime = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString();
};
