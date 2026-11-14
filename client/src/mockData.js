// Class Clinic — in-memory seed data used by the mock backend.
// The real backend (server/) exposes the same data through HTTP. This module
// exists so the frontend works out of the box while the server is being built.

import { toISODate, addDays } from "./date.js";

// ---- Seed data (defined before createStore/getStore so module load does not
// trip the temporal dead zone on the `const` seeds) ----------------------------

export const TODAY = toISODate();

export const SEED_DOCTORS = [
  { id: "doc-1", name: "Dr. Ayşe Yılmaz", specialty: "Genel Diş Hekimliği" },
  { id: "doc-2", name: "Dr. Mehmet Demir", specialty: "Ortopedi" },
  { id: "doc-3", name: "Dr. Elif Kaya", specialty: "Endodonti" },
  { id: "doc-4", name: "Dr. Ahmet Şahin", specialty: "Prosthodonti" },
];

export const SEED_PATIENTS = [
  {
    id: "pat-1",
    name: "Ayşe Yılmaz",
    email: "ayse.yilmaz@example.com",
    phone: "0532 123 45 67",
  },
  {
    id: "pat-2",
    name: "Mehmet Demir",
    email: "mehmet.demir@example.com",
    phone: "0532 987 65 43",
  },
  {
    id: "pat-3",
    name: "Elif Kaya",
    email: "elif.kaya@example.com",
    phone: "0531 555 01 99",
  },
  {
    id: "pat-4",
    name: "Zeynep Kaya",
    email: "zeynep.kaya@example.com",
    phone: "0531 444 12 33",
  },
  {
    id: "pat-5",
    name: "Hasan Ali",
    email: "hasan.ali@example.com",
    phone: "0532 777 88 99",
  },
];

export const SEED_USERS = [
  {
    id: "usr-1",
    username: "admin",
    password: "admin123",
    name: "Admin User",
    email: "admin@classclinic.local",
    role: "admin",
    active: true,
  },
  {
    id: "usr-2",
    username: "coordinator",
    password: "coord123",
    name: "Coordinating Staff",
    email: "coordinator@classclinic.local",
    role: "coordinator",
    active: true,
  },
  {
    id: "usr-3",
    username: "doctor",
    password: "doctor123",
    name: "Dr. Ayşe Yılmaz",
    email: "ayse@classclinic.local",
    role: "doctor",
    active: true,
  },
  {
    id: "usr-4",
    username: "assistant",
    password: "assistant123",
    name: "Asist. Zeynep Kaya",
    email: "zeynep@classclinic.local",
    role: "assistant",
    active: true,
  },
  {
    id: "usr-5",
    username: "translator",
    password: "translator123",
    name: "Translator",
    email: "translator@classclinic.local",
    role: "translator",
    active: false,
  },
];

/** Helper: pick the first user for a demo role (for login demos). */
export function SEED_USER(role) {
  return SEED_USERS.find((u) => u.role === role);
}

// ---- Store / API layer (defined after the seeds) ----------------------------

/** Deep-cloned, mutable in-memory "database". */
export function createStore() {
  return {
    doctors: SEED_DOCTORS.map((d) => ({ ...d })),
    patients: SEED_PATIENTS.map((p) => ({ ...p })),
    users: SEED_USERS.map((u) => ({ ...u })),
    appointments: SEED_APPOINTMENTS.map((a) => ({ ...a })),
  };
}

/** Rebuild the in-memory database from the seeds (each import gets a fresh DB). */
export function resetStore() {
  _store = createStore();
  return _store;
}

export function getStore() {
  return _store;
}

/** Few appointment samples spread across the current week (UTC dates). */
export function makeSeedAppointments(today) {
  const d = (offset) => addDays(today, offset);
  return [
    {
      id: "apt-1",
      doctorId: "doc-1",
      patientId: "pat-1",
      date: d(0),
      startTime: "09:00",
      duration: 45,
      type: "muayene",
      status: "confirmed",
      note: "Classic check-up; patient reports sensitivity on the lower left.",
    },
    {
      id: "apt-2",
      doctorId: "doc-1",
      patientId: "pat-2",
      date: d(0),
      startTime: "10:30",
      duration: 30,
      type: "randevu",
      status: "confirmed",
      note: "New patient registration.",
    },
    {
      id: "apt-3",
      doctorId: "doc-2",
      patientId: "pat-3",
      date: d(0),
      startTime: "14:00",
      duration: 60,
      type: "cerrahi",
      status: "pending",
      note: "Impacted wisdom tooth extraction.",
    },
    {
      id: "apt-4",
      doctorId: "doc-3",
      patientId: "pat-4",
      date: d(1),
      startTime: "08:30",
      duration: 45,
      type: "tedavi",
      status: "pending",
      note: "Fill on the upper right.",
    },
    {
      id: "apt-5",
      doctorId: "doc-3",
      patientId: "pat-5",
      date: d(1),
      startTime: "11:15",
      duration: 30,
      type: "prova",
      status: "completed",
      note: "Prosthesis fit trial.",
    },
    {
      id: "apt-6",
      doctorId: "doc-4",
      patientId: "pat-1",
      date: d(2),
      startTime: "09:30",
      duration: 120,
      type: "implant",
      status: "inTreatment",
      note: "Implant placement; patient under local anesthesia.",
    },
    {
      id: "apt-7",
      doctorId: "doc-2",
      patientId: "pat-2",
      date: d(3),
      startTime: "15:00",
      duration: 45,
      type: "muayene",
      status: "canceled",
      note: "Rescheduled to next week.",
    },
    {
      id: "apt-8",
      doctorId: "doc-1",
      patientId: "pat-3",
      date: d(3),
      startTime: "13:00",
      duration: 30,
      type: "randevu",
      status: "pending",
      note: "Follow-up consultation.",
    },
    {
      id: "apt-9",
      doctorId: "doc-3",
      patientId: "pat-4",
      date: d(0),
      startTime: "08:15",
      duration: 45,
      type: "muayene",
      status: "inTreatment",
      note: "Routine follow-up.",
    },
    {
      id: "apt-10",
      doctorId: "doc-4",
      patientId: "pat-5",
      date: d(2),
      startTime: "10:00",
      duration: 30,
      type: "tedavi",
      status: "completed",
      note: "Crown cementation.",
    },
  ];
}

export const SEED_APPOINTMENTS = makeSeedAppointments(TODAY);

/** Live in-memory store created after all seed data is initialized. */
let _store = createStore();
