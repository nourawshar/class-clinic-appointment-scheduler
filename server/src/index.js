// server/src/index.js
//
// Express + Prisma + express-session backend for Class Clinic.
//
// Endpoints (all under /api):
//   POST /api/login        username + password  → session + returns user
//   GET  /api/me           → current user (401 if unauthenticated)
//   GET  /api/doctors      → active doctors
//   GET  /api/patients     → patients (coordinator + admin; else 403)
//   POST /api/patients     → create patient (coordinator + admin)
//   PUT  /api/patients/:id → update patient (coordinator + admin)
//   GET  /api/appointments?date=YYYY-MM-DD → grouped by doctor (role-scoped)
//   POST /api/appointments → create appointment (coordinator + admin)
//   PUT  /api/appointments/:id → update (coordinator + admin)
//   DELETE /api/appointments/:id → delete (coordinator + admin)
//   PATCH /api/appointments/:id/status → status change (coordinator + admin + doctor + assistant)
//   GET  /api/audit        → audit log (coordinator + admin)
//   GET  /api/health       → PostgreSQL connect check

const express = require("express");
const session = require("express-session");
const path = require("path");
const config = require("./config");
const prisma = require("./db");
const authRoutes = require("./routes/auth");
const doctorsRoutes = require("./routes/doctors");
const patientsRoutes = require("./routes/patients");
const appointmentsRoutes = require("./routes/appointments");
const auditRoutes = require("./routes/audit");
const healthRoutes = require("./routes/health");
const usersRoutes = require("./routes/users");

const app = express();

// ---- middleware -------------------------------------------------------------

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// express-session with a memory store (single-process / dev workflow).
// In production, swap to a persistent store (e.g. connect-pg Sequelize/Prisma
// or Redis) by wiring a file-backed or DB-backed store here.
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      // httpOnly + secure in prod (behind TLS). Secure is disabled here so
      // the service works over plain HTTP locally; set COOKIE_SECURE=true
      // behind a TLS terminator.
      secure: process.env.COOKIE_SECURE === "true",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// ---- routes -----------------------------------------------------------------

app.use("/api", authRoutes);
app.use("/api", doctorsRoutes);
app.use("/api", patientsRoutes);
app.use("/api", usersRoutes);
app.use("/api", appointmentsRoutes);
app.use("/api", auditRoutes);
app.use("/api", healthRoutes);

// ---- 404 handler ------------------------------------------------------------

app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
});

// ---- error handler ------------------------------------------------------------

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// ---- startup -----------------------------------------------------------------

const PORT = config.port;
prisma
  .$connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Class Clinic API listening on http://0.0.0.0:${PORT}`);
      console.log(`  env .env loaded     : ${config.hasDotenv}`);
      console.log(`  database url        : ${config.databaseUrl.replace(/:([^:@]+)@/, ":*[redacted]@")}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to PostgreSQL:", err);
    process.exit(1);
  });

module.exports = app; // so tests can require() and spin down cleanly
