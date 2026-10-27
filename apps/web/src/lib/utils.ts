import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isValid } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toLocaleString('en-IN');
}

export function formatPercentage(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '0%';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/**
 * Safely format distance to now without throwing RangeError on invalid, null, or undefined dates.
 */
export function formatRelativeTime(
  dateValue: Date | string | number | null | undefined,
  options?: Parameters<typeof formatDistanceToNow>[1],
  fallback: string = "Recently",
): string {
  if (!dateValue) return fallback;
  try {
    const date =
      typeof dateValue === "string" || typeof dateValue === "number"
        ? new Date(dateValue)
        : dateValue;

    if (!isValid(date) || isNaN(date.getTime())) {
      return fallback;
    }

    return formatDistanceToNow(date, options);
  } catch {
    return fallback;
  }
}

/**
 * Safely format an expiration date (handles both future and past expired dates).
 */
export function formatExpiration(
  expiresAt: Date | string | number | null | undefined,
  fallback: string = "Expires soon",
): string {
  if (!expiresAt) return fallback;
  try {
    const date =
      typeof expiresAt === "string" || typeof expiresAt === "number"
        ? new Date(expiresAt)
        : expiresAt;

    if (!isValid(date) || isNaN(date.getTime())) {
      return fallback;
    }

    const now = new Date();
    if (date < now) {
      return `Expired ${formatDistanceToNow(date, { addSuffix: true })}`;
    }
    return `Expires in ${formatDistanceToNow(date)}`;
  } catch {
    return fallback;
  }
}

/**
 * Safely format a date without throwing RangeError on invalid, null, or undefined dates.
 */
export function formatDateSafe(
  dateValue: Date | string | number | null | undefined,
  formatString: string = "dd MMM yyyy",
  fallback: string = "-"
): string {
  if (!dateValue) return fallback;
  try {
    const date =
      typeof dateValue === "string" || typeof dateValue === "number"
        ? new Date(dateValue)
        : dateValue;

    if (!isValid(date) || isNaN(date.getTime())) {
      return fallback;
    }

    return format(date, formatString);
  } catch {
    return fallback;
  }
}

