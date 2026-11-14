// server/src/utils/validate.js
//
// Shared validation helpers for the appointment and patient flows.

const enumValues = (enm) => Object.values(enm).filter((v) => typeof v === "string");

// allowed appointment types
const AppointmentType = {
  randevu: "randevu",
  muayene: "muayene",
  tedavi: "tedavi",
  cerrahi: "cerrahi",
  prova: "prova",
  implant: "implant",
};

// allowed appointment statuses
const AppointmentStatus = {
  pending: "pending",
  canceled: "canceled",
  confirmed: "confirmed",
  arrived: "arrived",
  completed: "completed",
  notAttended: "notAttended",
  inTreatment: "inTreatment",
  postponed: "postponed",
  notReached: "notReached",
};

function isOneOf(value, allowed) {
  return allowed.includes(value);
}

/** Appointment-type validation. Re-exported from the schema enum. */
function isValidType(type) {
  return isOneOf(type, Object.values(AppointmentType));
}

/** Appointment-status validation. Re-exported from the schema enum. */
function isValidStatus(status) {
  return isOneOf(status, Object.values(AppointmentStatus));
}

/** Sanitise a string field: trim + collapse internal whitespace. Returns '' when falsy. */
function sanitizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

module.exports = {
  AppointmentType,
  AppointmentStatus,
  isValidType,
  isValidStatus,
  sanitizeText,
  isOneOf,
};
