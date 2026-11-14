// Class Clinic — shared constants: form options, role/domain maps.

/** Selectable appointment types.  `key` is a translation key in i18n. */
export const TYPE_OPTIONS = [
  { value: "randevu",  key: "typeRandevu" },
  { value: "muayene",  key: "typeMuayene" },
  { value: "tedavi",   key: "typeTedavi" },
  { value: "cerrahi",  key: "typeCerrahi" },
  { value: "prova",    key: "typeProva" },
  { value: "implant",  key: "typeImplant" },
];

/** Selectable appointment statuses. */
export const STATUS_OPTIONS = [
  { value: "pending",      key: "statusPending" },
  { value: "canceled",     key: "statusCanceled" },
  { value: "confirmed",    key: "statusConfirmed" },
  { value: "arrived",      key: "statusArrived" },
  { value: "completed",    key: "statusCompleted" },
  { value: "notAttended",  key: "statusNotAttended" },
  { value: "inTreatment",  key: "statusInTreatment" },
  { value: "postponed",    key: "statusPostponed" },
  { value: "notReached",   key: "statusNotFound" },
];

/**
 * Role permission matrix (from the requirements).
 * - Appointment edit (detail/save): coordinator, admin, doctor, assistant (NOT translator)
 * - Patient management: coordinator + admin (hidden from doctor/assistant/translator)
 * - User management: admin only
 */
export const ROLES = ["admin", "coordinator", "doctor", "assistant", "translator"];

export const PERMISSIONS = {
  editAppointment: (role) =>
    ["admin", "coordinator", "doctor", "assistant"].includes(role),
  managePatients: (role) => ["admin", "coordinator"].includes(role),
  manageUsers: (role) => role === "admin",
};

/** Normalize a free-form type string into a known enum value (for persisted fields). */
export function normalizeType(value) {
  const clean = String(value || "").trim().toLowerCase();
  return TYPE_OPTIONS.some((o) => o.value === clean)
    ? clean
    : "randevu";
}

/** Normalize a free-form status string into a known enum value. */
export function normalizeStatus(value) {
  const clean = String(value || "").trim().toLowerCase();
  const known = STATUS_OPTIONS.map((o) => o.value);
  return known.includes(clean) ? clean : "planned";
}

/** Format a date as a human readable string for labels. */
export function formatDate(dateStr, lang) {
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  const options = { weekday: "short", day: "numeric", month: "short" };
  return d.toLocaleDateString(lang, options);
}

/** Format 24h time as "HH:MM". */
export function formatTime(hhmm) {
  if (!hhmm) return "";
  const m = String(hhmm).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return hhmm;
  let h = parseInt(m[1], 10);
  const am = h >= 12;
  const h12 = h % 12 || 12;
  return `${h12}:${m[2]} ${am ? "PM" : "AM"}`;
}
