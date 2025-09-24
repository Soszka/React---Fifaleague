const NUMERIC_TIMESTAMP = /^\d+$/;

export const normalizeDateValue = (value: number | string): number => {
  if (typeof value === "number") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return NaN;
  }

  if (NUMERIC_TIMESTAMP.test(trimmed)) {
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : NaN;
  }

  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? NaN : parsed;
};

export const formatDateValue = (
  value: number | string,
  locale?: string
): string => {
  const normalized = normalizeDateValue(value);
  if (!Number.isFinite(normalized)) {
    return "";
  }

  return new Date(normalized).toLocaleDateString(locale);
};
