// Class Clinic — presentation helpers shared across components.
import { TYPE_OPTIONS, STATUS_OPTIONS } from "./constants.js";
import { t } from "./i18n.js";

/** Translates a type enum value to its labelled UI string. */
export function typeLabel(type) {
  const opt = TYPE_OPTIONS.find(
    (o) => o.value === String(type ?? "").toLowerCase()
  );
  return opt ? t(opt.key) : String(type ?? "").toUpperCase();
}

/** Translates a status enum value to its labelled UI string. */
export function statusLabel(status) {
  const opt = STATUS_OPTIONS.find(
    (o) => o.value === String(status ?? "").toLowerCase()
  );
  return opt ? t(opt.key) : String(status ?? "");
}

/** Human readable patient name from a patient record. */
export function patientDisplayName(patient) {
  if (!patient) return "";
  const full = patient.name || `${patient.firstName || ""} ${patient.lastName || ""}`.trim();
  return full || "—";
}

/** "09:00–09:45" from start time + duration (minutes). */
export function startTimeRange(appointment) {
  if (!appointment) return "";
  const start = String(appointment.startTime || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!start) return String(appointment.startTime || "");
  let h = parseInt(start[1], 10);
  const m = start[2];
  const total = h * 60 + parseInt(m, 10) + (parseInt(appointment.duration || 0) || 0);
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Human readable relative/absolute date label (e.g. "Mon 11/17"). */
export function formatDateShort(dateStr, lang) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  const opts = { weekday: "short", month: "short", day: "numeric" };
  return d.toLocaleDateString(lang, opts);
}
