import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Normalize plate to mercosul/old format with dash when possible
export function formatPlaca(raw?: any) {
  if (!raw) return null;
  const s = String(raw).toUpperCase();
  const cleaned = s.replace(/[^A-Z0-9]/g, '');
  const merc = cleaned.match(/^([A-Z]{3})(\d[A-Z]\d{2})$/);
  if (merc) return `${merc[1]}-${merc[2]}`;
  const old = cleaned.match(/^([A-Z]{3})(\d{4})$/);
  if (old) return `${old[1]}-${old[2]}`;
  return s;
}

// Convert specific empty-string keys to null in an object
export function emptyToNull(obj: Record<string, any>, keys: string[]) {
  const out = { ...obj };
  keys.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(out, k) && out[k] === '') out[k] = null;
  });
  return out;
}
