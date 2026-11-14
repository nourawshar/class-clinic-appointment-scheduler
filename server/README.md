# Class Clinic — Appointment Scheduler (server)

Node.js + Express + Prisma ORM + PostgreSQL backend for the Class Clinic
dental-department appointment scheduler.

## Stack

- Express 4
- express-session (memory store for dev; swap to a persistent store in prod)
- bcryptjs (password hashing)
- Prisma 6 + PostgreSQL (schema + type-safe client, migrations, audit trail)
- TypeScript-free JS — plain CommonJS, zero build step

## Setup

```bash
# 1. Environment (copy the example)
cp .env.example .env
#   DATABASE_URL=postgresql://user:pass@localhost:5432/clinic_db
#   SESSION_SECRET=<long random string>

# 2. Install dependencies
npm install

# 3. Generate the Prisma client (requires a running Postgres with the db)
npx prisma generate

# 4. (optional) Push the schema to the database
npx prisma db push

# 5. Seed users, doctors and a sample patient
npm run seed

# 6. Start the API
npm start          # or: npm run dev
```

## Endpoints

| Method | Path                                      | Auth required                      | Description |
|--------|-------------------------------------------|------------------------------------|-------------|
| POST   | `/api/login`                              | none                               | username + password → session, returns user |
| GET    | `/api/me`                                 | required                           | current user (401 if not logged in) |
| GET    | `/api/doctors`                            | none                               | active doctors |
| GET    | `/api/patients`                           | coordinator + admin                | patients list (403 otherwise) |
| POST   | `/api/patients`                           | coordinator + admin                | create patient |
| PUT    | `/api/patients/:id`                       | coordinator + admin                | update patient |
| GET    | `/api/appointments?date=YYYY-MM-DD`       | required                           | grouped by doctor (role-scoped, see below) |
| POST   | `/api/appointments`                       | coordinator + admin                | create (conflict-checked) |
| PUT    | `/api/appointments/:id`                   | coordinator + admin                | update (conflict-checked) |
| DELETE | `/api/appointments/:id`                   | coordinator + admin                | delete (audited) |
| PATCH  | `/api/appointments/:id/status`            | coordinator + admin + doctor + assistant | status change (translator → 403) |
| GET    | `/api/audit`                              | coordinator + admin                | audit log |
| GET    | `/api/health`                             | none                               | PostgreSQL connect check |

### Appointment `date` query param

`GET /api/appointments?date=YYYY-MM-DD` returns appointments grouped by doctor:

```json
{
  "appointments": [
    {
      "doctor": { "id": "...", "firstName": "...", "lastName": "...", "isActive": true },
      "appointments": [
        { "id": "...", "patientName": "...", "date": "2026-11-14", "startTime": "09:00",
          "durationMinutes": 30, "type": "randevu", "status": "pending", "note": "..." }
      ]
    }
  ]
}
```

### Role scoping (GET /api/appointments)

- **admin / coordinator** → all appointments for the date
- **doctor / assistant** → only appointments whose `doctorId` matches their own doctor
- **translator** → all appointments for the date (translated records are shared)

### Conflict detection

A new appointment conflicts when another appointment of the same doctor on the same
date overlaps in wall-clock time:

```
overlap(a, b)  ⇔  a.start < b.start + b.duration  ∧  a.start + a.duration > b.start
```

## Audit trail

Every `create`, `update`, `delete` and `statusChange` writes an `AuditLog` row with
`userId`, `action`, `entityType`, `entityId`, `details` and `createdAt`. Field changes
are recorded as `old→new` strings, e.g.

```json
{ "patientName": "SM→ISMAIL MUHAMMAD", "status": "pending→confirmed" }
```

Role values: `admin`, `coordinator`, `doctor`, `assistant`, `translator`.
Appointment `type` values: `randevu`, `muayene`, `tedavi`, `cerrahi`, `provo`.
Appointment `status` values: `pending`, `canceled`, `confirmed`, `arrived`, `completed`,
`notAttended`, `inTreatment`, `postponed`, `notReached`.

## Tests

The API is exercised with plain `curl` (see `test/README.md`). Run:

```bash
node test/api.test.js        # or: npm run test
```

> Requirements: Node ≥ 18, PostgreSQL, and a `DATABASE_URL` whose database exists
> (`npx prisma db push` or `npm run seed` will create the tables).
