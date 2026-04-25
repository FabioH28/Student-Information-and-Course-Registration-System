import { format, formatDistanceToNow, parseISO } from "date-fns";

function toDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(value: string | null | undefined, fallback = "-") {
  const parsed = toDate(value);
  return parsed ? format(parsed, "MMM d, yyyy") : fallback;
}

export function formatDateTime(value: string | null | undefined, fallback = "-") {
  const parsed = toDate(value);
  return parsed ? format(parsed, "MMM d, yyyy 'at' h:mm a") : fallback;
}

export function formatRelativeDateTime(value: string | null | undefined, fallback = "Just now") {
  const parsed = toDate(value);
  return parsed ? `${formatDistanceToNow(parsed, { addSuffix: true })}` : fallback;
}

export function formatTimeValue(value: string | null | undefined, fallback = "-") {
  if (!value) {
    return fallback;
  }

  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return fallback;
  }

  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return format(date, "h:mm a");
}

export function formatCurrencyValue(amount: number | string | null | undefined, currency = "USD") {
  const numericAmount = typeof amount === "number" ? amount : Number(amount ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numericAmount) ? numericAmount : 0);
}

export function titleize(value: string | null | undefined, fallback = "-") {
  if (!value) {
    return fallback;
  }

  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

