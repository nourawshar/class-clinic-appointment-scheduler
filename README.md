# Class Clinic — Appointment Scheduler

React + PostgreSQL appointment scheduling app for Class Clinic's dental department.
Run the daily schedule in the browser: doctors as rows, appointments per doctor
per day, per-appointment status changes, plus patient and user management.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite (plain CSS, no UI framework) |
| Backend | Node.js + Express + express-session (session auth) |
| Database | PostgreSQL + Prisma ORM |
| Auth | username + password (bcrypt) with role-based access |

### Roles

| Role | Appointment CRUD | Status change | Patients | Users |
|---|---|---|---|---|
| admin | all | all | yes | yes |
| coordinator | all | all | yes | no |
| doctor | view only | own | no | no |
| assistant | view only | own doctor's | no | no |
| translator | view only | all (translators) | no | no |

---

## Local setup

### What you need

- **Node.js** ≥ 18 (with npm)
- **PostgreSQL** (≥ 14) — install via your OS package manager, or via Docker:
  ```bash
  docker run --name clinic-db -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=clinic_db -p 5432:5432 -d postgres:16
  ```

### Step 1 — Clone and install dependencies

```bash
git clone https://github.com/nourawshar/class-clinic-appointment-scheduler.git
cd class-clinic-appointment-scheduler
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Step 2 — Configure the server

```bash
cd server
cp .env.example .env
```

Edit `.env`:

```ini
DATABASE_URL=postgresql://user:***@localhost:5432/clinic_db
SESSION_SECRET=<long-random-string>
PORT=4000
```

Create the database:

```bash
# PostgreSQL 16 Docker:
#   createdb clinic_db
# (native Postgres: use your preferred client or `createdb`)

npx prisma generate
npx prisma db push          # or: npx prisma migrate dev
npm run seed                # creates admin / coordinator / doctor / assistant / translator users + a doctor row
```

> On first run, the `.env` will be read. `DATABASE_URL` must point at a DB whose
> **database** already exists. `npm run seed` creates the DB tables + seed rows.

### Step 3 — Start the servers

Terminal 1 (API):

```bash
cd server
npm run dev          # http://localhost:4000/api
```

Terminal 2 (Frontend):

```bash
cd client
npm run dev          # http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## Demo login

Seeding creates these users (password shown for the demo — change them):

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | admin |
| `coordinator` | `coord123` | coordinator |
| `doctor` | `doctor123` | doctor |
| `assistant` | `assistant123` | assistant |
| `translator` | `translator123` | translator (inactive) |

---

## How it works

### Daily view

On load, the app shows **today's** schedule. Use the date dropdown at the top to
jump forward/backward. Each doctor is a **row**; under each doctor are their
appointments, sorted by start time.

Click any appointment card to open its detail panel — you can edit fields and
**change status** here. Only these roles can change status: admin, coordinator,
doctor, assistant. **Translators** can view everything but **cannot** change
status (read-only + status change only).

### Add / edit appointment

The form has:
- **Doctor** — dropdown (all active doctors)
- **Patient** — search input + datalist of registered patients (add patients from
  the Patients page if not already there)
- **Date** — date picker (can't be in the past)
- **Start time** — time picker
- **Duration (minutes)** — expected length
- **Type** — randevu / muayene / tedavi / cerrahi / prova / implant
- **Status** — pending / canceled / confirmed / arrived / completed / not attended
  / in treatment / postponed / not reached
- **Note** — free text

When you save, the backend checks for **conflicts** (same doctor, same date,
overlapping time) and rejects with a 409 error.

### Patients & users

- **Patients** page (coordinator + admin): add/edit patients (names only, for
  now).
- **Users** page (admin): manage user accounts (name, surname, role, active flag).

---

## API summary (server)

| Method | Path | Auth required | Description |
|---|---|---|---|
| POST | `/api/login` | none | username + password → session |
| GET | `/api/me` | required | current user (401 if not logged in) |
| GET | `/api/doctors` | none | active doctors |
| GET | `/api/patients` | coordinator + admin | patients list |
| POST | `/api/patients` | coordinator + admin | create patient |
| PUT | `/api/patients/:id` | coordinator + admin | update patient |
| GET | `/api/appointments?date=YYYY-MM-DD` | required | grouped by doctor (role-scoped) |
| POST | `/api/appointments` | coordinator + admin | create (conflict-checked) |
| PUT | `/api/appointments/:id` | coordinator + admin | update (conflict-checked) |
| DELETE | `/api/appointments/:id` | coordinator + admin | delete (audited) |
| PATCH | `/api/appointments/:id/status` | coordinator + admin + doctor + assistant | status change (translator → 403) |
| GET | `/api/audit` | coordinator + admin | audit log |
| GET | `/api/health` | none | PostgreSQL connect check |

---

## Language

The UI is bilingual: Turkish (default) and English. Toggle in the top-right
corner. All translated text lives in `client/src/i18n.js`.

## Data model (database)

| Table | Key fields |
|---|---|
| `User` | username, passwordHash, firstName, lastName, role, doctorId, isActive |
| `Doctor` | firstName, lastName, isActive |
| `Patient` | name |
| `Appointment` | doctorId, patientName, date, startTime, durationMinutes, type, status, note |
| `AuditLog` | userId, action, entityType, entityId, details (JSON) |

### Type and status enums

**AppointmentType:** `randevu`, `muayene`, `tedavi`, `cerrahi`, `provo`, `implant`

**AppointmentStatus:** `pending`, `canceled`, `confirmed`, `arrived`, `completed`,
`notAttended`, `inTreatment`, `postponed`, `notReached`
