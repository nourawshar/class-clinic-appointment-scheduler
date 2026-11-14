// Class Clinic — unified API backend object.
//
// Every component imports the named functions from "./api.js". At load time the
// correct implementation (mock in-memory OR real HTTP fetch) is chosen and a
// single object with functions + data-access helpers is exported.
//
// Mock mode: data lists reflect the live in-memory store (doctors, patients,
// appointments, users that were added/edited during the session).
// Real mode: data lists fall back to the repo seeds until the real backend is up.

import { API_BASE, MOCK_MODE } from "./config.js";
import * as realMod from "./api-real.js";
import * as mockMod from "./mockApi.js";
import { SEED_DOCTORS, SEED_PATIENTS } from "./mockData.js";

const endpoint = MOCK_MODE ? mockMod : realMod;

const backend = {
  // Endpoint functions (identical surface every implementation).
  login: endpoint.login,
  getAppointmentsForDate: endpoint.getAppointmentsForDate,
  createAppointment: endpoint.createAppointment,
  updateAppointment: endpoint.updateAppointment,
  deleteAppointment: endpoint.deleteAppointment,
  getPatients: endpoint.getPatients,
  createPatient: endpoint.createPatient,
  updatePatient: endpoint.updatePatient,
  deletePatient: endpoint.deletePatient,
  getUsers: endpoint.getUsers,
  createUser: endpoint.createUser,
  updateUser: endpoint.updateUser,
  deleteUser: endpoint.deleteUser,
  reset: endpoint.reset || (() => {}),

  // Data access (live in mock; seed fallback in real until the real backend).
  listDoctors: endpoint.listDoctors || (() => SEED_DOCTORS),
  listPatients: endpoint.listPatients || (() => SEED_PATIENTS),
};

export const login = backend.login;
export const getAppointmentsForDate = backend.getAppointmentsForDate;
export const createAppointment = backend.createAppointment;
export const updateAppointment = backend.updateAppointment;
export const deleteAppointment = backend.deleteAppointment;
export const getPatients = backend.getPatients;
export const createPatient = backend.createPatient;
export const updatePatient = backend.updatePatient;
export const deletePatient = backend.deletePatient;
export const getUsers = backend.getUsers;
export const createUser = backend.createUser;
export const updateUser = backend.updateUser;
export const deleteUser = backend.deleteUser;
export const reset = backend.reset;
export const listDoctors = backend.listDoctors;
export const listPatients = backend.listPatients;

export default backend;
