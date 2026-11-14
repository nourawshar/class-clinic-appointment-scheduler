// Class Clinic — shared date helpers (no external dependencies).
// All dates are UTC "YYYY-MM-DD" strings so they stay stable across servers.

/** Formats a Date as a YYYY-MM-DD string in the local timezone. */
export function toISODate(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const d = String(local.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses a YYYY-MM-DD string into a local Date at midnight. */
export function parseISODate(value) {
  const m = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  if (mo < 1 || mo > 12 || day < 1 || day > 31) return null;
  return new Date(y, mo - 1, day);
}

/** Adds `days` to a YYYY-MM-DD date string (can go to next/previous month). */
export function addDays(dateStr, days) {
  const d = parseISODate(dateStr);
  if (!d) return dateStr;
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Returns the first day-of-month for a YYYY-MM-DD string. */
export function startOfMonth(dateStr) {
  return parseISODate(dateStr)?.toISOString().slice(0, 10).replace(
    /(\d{4})-(\d{2})-\d{2}/,
    "$1-$2-01"
  );
}

/** Returns the last day-of-month for a YYYY-MM-DD string. */
export function endOfMonth(dateStr) {
  const d = parseISODate(dateStr);
  if (!d) return dateStr;
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const y = last.getFullYear();
  const m = String(last.getMonth() + 1).padStart(2, "0");
  const day = String(last.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
