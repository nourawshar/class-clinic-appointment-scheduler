// Class Clinic — in-memory mock backend.
// Implements the exact same function surface as src/api.js (real fetch) so every
// component stays backend-agnostic. Replaces it when MOCK_MODE = true.

import { ApiError } from "./error.js";
import {
  getStore,
  resetStore,
  SEED_DOCTORS,
  SEED_PATIENTS,
  SEED_USERS,
  SEED_APPOINTMENTS,
  SEED_USER,
} from "./mockData.js";

let store = getStore();
let _aptSeq = SEED_APPOINTMENTS.length + 1;

function ids() {
  return { doctorId: "doc-" + (_aptSeq % 900 + 1), patientId: "pat-" + (_aptSeq % 500 + 1) };
}

function findAppointment(id) {
  return store.appointments.find((a) => a.id === id);
}

function findPatient(id) {
  return store.patients.find((p) => p.id === id);
}

function findUser(id) {
  return store.users.find((u) => u.id === id);
}

function findDoctor(id) {
  return store.doctors.find((d) => d.id === id);
}

/** POST /api/login -> { success: true, user, token } (401 on bad credentials). */
export async function login(credentials) {
  const username = String(credentials && credentials.username || "").trim();
  const password = String(credentials && credentials.password || "");

  const user = store.users.find((u) => u.username === username);
  if (!user || user.password !== password) {
    throw new ApiError(401, "login_failed");
  }
  if (!user.active) {
    throw new ApiError(403, "user_inactive");
  }
  return { success: true, user: { id: user.id, username: user.username, name: user.name, role: user.role, active: user.active }, token: `mock-token-${user.id}` };
}

/** GET /api/appointments?date=YYYY-MM-DD -> filtered list. */
export async function getAppointmentsForDate(date) {
  return store.appointments.filter((a) => a.date === String(date));
}

/** POST /api/appointments -> created appointment. */
export async function createAppointment(payload) {
  const doctor = findDoctor(payload.doctorId);
  const patient = findPatient(payload.patientId);
  if (!doctor) throw new ApiError(400, "doctor_not_found");
  if (!patient) throw new ApiError(400, "patient_not_found");

  const appointment = {
    id: `apt-${_aptSeq++}`,
    doctorId: payload.doctorId,
    patientId: payload.patientId,
    date: payload.date,
    startTime: payload.startTime,
    duration: payload.duration,
    type: payload.type,
    status: payload.status,
    note: payload.note,
  };
  store.appointments.push(appointment);
  return appointment;
}

/** PUT /api/appointments/:id -> updated appointment. */
export async function updateAppointment(id, payload) {
  const appointment = findAppointment(id);
  if (!appointment) throw new ApiError(404, "appointment_not_found");

  Object.assign(appointment, payload);
  return appointment;
}

/** DELETE /api/appointments/:id */
export async function deleteAppointment(id) {
  const idx = store.appointments.findIndex((a) => a.id === id);
  if (idx === -1) throw new ApiError(404, "appointment_not_found");
  store.appointments.splice(idx, 1);
  return { ok: true };
}

/** GET /api/patients -> list. */
export async function getPatients() {
  return store.patients.map((p) => ({
    ...p,
    firstName: p.name.split(" ")[0],
    lastName: p.name.split(" ").slice(1).join(" "),
  }));
}

/** POST /api/patients */
export async function createPatient(payload) {
  const name = String(payload && payload.name || "").trim();
  if (!name) throw new ApiError(400, "name_required");
  if (store.patients.some((p) => p.email === String(payload.email || "").trim().toLowerCase())) {
    throw new ApiError(409, "email_already_used");
  }
  const patient = {
    id: `pat-${store.patients.length + 1}`,
    name,
    email: String(payload.email || "").trim(),
    phone: String(payload.phone || "").trim(),
  };
  store.patients.push(patient);
  return patient;
}

/** PUT /api/patients/:id */
export async function updatePatient(id, payload) {
  const patient = findPatient(id);
  if (!patient) throw new ApiError(404, "patient_not_found");
  if (payload && payload.name) patient.name = String(payload.name).trim();
  if (payload && payload.email) patient.email = String(payload.email).trim();
  if (payload && payload.phone) patient.phone = String(payload.phone).trim();
  return patient;
}

/** DELETE /api/patients/:id */
export async function deletePatient(id) {
  const idx = store.patients.findIndex((p) => p.id === id);
  if (idx === -1) throw new ApiError(404, "patient_not_found");
  store.patients.splice(idx, 1);
  return { ok: true };
}

/** GET /api/users -> list. */
export async function getUsers() {
  return store.users.map((u) => ({
    ...u,
    firstName: u.name.split(" ")[0],
    lastName: u.name.split(" ").slice(1).join(" "),
  }));
}

/** POST /api/users */
export async function createUser(payload) {
  const username = String(payload && payload.username || "").trim();
  if (!username) throw new ApiError(400, "username_required");
  if (store.users.some((u) => u.username === username)) {
    throw new ApiError(409, "username_already_used");
  }
  const user = {
    id: `usr-${store.users.length + 1}`,
    username,
    password: String(payload.password || ""),
    name: String(payload.name || "").trim(),
    email: String(payload.email || "").trim(),
    role: String(payload.role || "assistant"),
    active: Boolean(payload.active),
  };
  store.users.push(user);
  return user;
}

/** PUT /api/users/:id */
export async function updateUser(id, payload) {
  const user = findUser(id);
  if (!user) throw new ApiError(404, "user_not_found");
  if (payload && payload.username && payload.username !== user.username) {
    if (store.users.some((u) => u.username === String(payload.username))) {
      throw new ApiError(409, "username_already_used");
    }
    user.username = String(payload.username).trim();
  }
  if (payload && payload.name) user.name = String(payload.name).trim();
  if (payload && payload.email) user.email = String(payload.email).trim();
  if (payload && payload.role) user.role = String(payload.role);
  if (payload && payload.active !== undefined) user.active = Boolean(payload.active);
  if (payload && payload.password) user.password = String(payload.password);
  return user;
}

/** DELETE /api/users/:id */
export async function deleteUser(id) {
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx === -1) throw new ApiError(404, "user_not_found");
  store.users.splice(idx, 1);
  return { ok: true };
}

/** Live read access to the in-memory store (mock only). */
export function listDoctors() {
  return store.doctors;
}

export function listPatients() {
  return store.patients;
}

/** Re-seed the in-memory database (used when returning to the app). */
export function reset() {
  store = {
    doctors: SEED_DOCTORS.map((d) => ({ ...d })),
    patients: SEED_PATIENTS.map((p) => ({ ...p })),
    users: SEED_USERS.map((u) => ({ ...u })),
    appointments: SEED_APPOINTMENTS.map((a) => ({ ...a })),
  };
  _aptSeq = SEED_APPOINTMENTS.length + 1;
  return store;
}
