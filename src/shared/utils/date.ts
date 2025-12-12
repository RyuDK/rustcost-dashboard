export const toIsoDate = (date: Date): string => date.toISOString().split("T")[0];

export const subtractDays = (date: Date, days: number): Date => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - days);
  return copy;
};

const toIsoDateTime = (date: Date): string => date.toISOString();

export const getDefaultDateRange = (days = 7) => {
  const end = new Date();
  const start = subtractDays(end, days);
  start.setHours(0, 0, 0, 0);

  return {
    start: toIsoDateTime(start),
    end: toIsoDateTime(end),
  };
};

export const formatDateTime = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString();
};
