export const toIsoDate = (date: Date) => date.toISOString().split("T")[0];

export const subtractDays = (date: Date, days: number) => {
  const clone = new Date(date);
  clone.setDate(clone.getDate() - days);
  return clone;
};
const toIsoDateTime = (d: Date) => d.toISOString().slice(0, 19); // removes trailing "Z"

export const getDefaultDateRange = (days = 7) => {
  const end = new Date();
  const start = subtractDays(end, days);

  return {
    start: toIsoDateTime(start), // e.g. 2025-11-10T00:00:00
    end: toIsoDateTime(end), // e.g. 2025-11-17T14:22:31
  };
};

export const formatDateTime = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString();
};
