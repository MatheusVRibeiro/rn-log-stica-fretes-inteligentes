// Utility to compute a shallow/deep diff between two objects.
// Returns an object containing only keys from `edited` whose normalized
// values differ from `original`. Values that are undefined/null/empty-string
// are treated as absent.
import { cleanPayload } from "./utils";

function normalizeValue(v: any) {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return v;
  if (Array.isArray(v)) return v.map(normalizeValue);
  if (typeof v === "object") {
    const out: Record<string, any> = {};
    Object.entries(v).forEach(([k, val]) => {
      out[k] = normalizeValue(val);
    });
    return out;
  }
  return v;
}

function isEqual(a: any, b: any): boolean {
  const na = normalizeValue(a);
  const nb = normalizeValue(b);
  // Simple deep equality via JSON.stringify of normalized values
  try {
    return JSON.stringify(na) === JSON.stringify(nb);
  } catch (e) {
    return na === nb;
  }
}

export function diffObjects<T extends Record<string, any>>(original: T | null | undefined, edited: Partial<T>): Partial<T> {
  const out: Partial<T> = {};
  if (!original) {
    // If no original, return cleaned edited (new resource)
    return cleanPayload(edited as Record<string, any>) as Partial<T>;
  }

  Object.keys(edited).forEach((k) => {
    const origVal = (original as any)[k];
    const editVal = (edited as any)[k];
    if (!isEqual(origVal, editVal)) {
      out[k as keyof T] = editVal as any;
    }
  });

  return cleanPayload(out as Record<string, any>) as Partial<T>;
}

export default diffObjects;
