export const formatBytes = (bytes: number, fractionDigits = 1): string => {
  if (!Number.isFinite(bytes)) {
    return "0 B";
  }
  const thresholds = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < thresholds.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(fractionDigits)} ${thresholds[index]}`;
};

export const formatMillis = (millis: number, fractionDigits = 0): string =>
  `${millis.toFixed(fractionDigits)} ms`;

export const formatCpu = (milliCores: number, fractionDigits = 1): string =>
  `${milliCores.toFixed(fractionDigits)} mC`;

export const formatCurrency = (
  value: number,
  currency: string,
  fractionDigits = 2
): string =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);

export const formatPercent = (value: number, fractionDigits = 1): string =>
  `${value.toFixed(fractionDigits)}%`;

export const sum = (values: number[]) =>
  values.reduce((acc, item) => acc + (Number.isFinite(item) ? item : 0), 0);
