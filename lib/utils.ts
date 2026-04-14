import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone: string) {
  if (!phone) return '';
  return `+${phone}`;
}

export function buildDateKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}
