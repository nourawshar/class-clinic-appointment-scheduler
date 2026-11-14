// Class Clinic — real backend API implementation (HTTP fetch).
// Used by src/api.js when MOCK_MODE=false. Exports the same named functions the
// mock backend exposes, for backend-agnostic component code.

import { ApiError, friendlyError } from "./error.js";

const BASE = import.meta.env.VITE_API_URL || "/api";
const ACCESS_TOKEN = () => localStorage.getItem("clinic_token");

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers:
      token && token !== "null"
        ? { ...headers, Authorization: `Bearer ${token}` }
        : headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg =
      (data && data.error) ||
      (data && data.message) ||
      `Request failed with status ${res.status}.`;
    throw new ApiError(res.status, msg);
  }
  return data;
}

/** POST /api/login -> { success: true, user, token } */
export async function login(credentials) {
  const data = await request("/login", {
    method: "POST",
    body: credentials,
  });
  return data;
}

/** GET /api/appointments?date=YYYY-MM-DD -> [{...}] */
export async function getAppointmentsForDate(date) {
  return request(`/appointments?date=${encodeURIComponent(String(date))}`);
}

/** POST /api/appointments -> created appointment */
export async function createAppointment(payload) {
  return request("/appointments", { method: "POST", body: payload });
}

/** PUT /api/appointments/:id -> updated appointment */
export async function updateAppointment(id, payload) {
  return request(`/appointments/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: payload,
  });
}

/** DELETE /api/appointments/:id */
export async function deleteAppointment(id) {
  return request(`/appointments/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
  });
}

/** GET /api/patients -> [{...}] */
export async function getPatients() {
  return request("/patients");
}

/** POST /api/patients */
export async function createPatient(payload) {
  return request("/patients", { method: "POST", body: payload });
}

/** PUT /api/patients/:id */
export async function updatePatient(id, payload) {
  return request(`/patients/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: payload,
  });
}

/** DELETE /api/patients/:id */
export async function deletePatient(id) {
  return request(`/patients/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
  });
}

/** GET /api/users -> [{...}] */
export async function getUsers() {
  return request("/users");
}

/** POST /api/users */
export async function createUser(payload) {
  return request("/users", { method: "POST", body: payload });
}

/** PUT /api/users/:id */
export async function updateUser(id, payload) {
  return request(`/users/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: payload,
  });
}

/** GET /api/doctors -> [{...}] */
export async function listDoctors() {
  return request("/doctors");
}

/** GET /api/patients -> [{...}] */
export async function listPatients() {
  return request("/patients");
}
