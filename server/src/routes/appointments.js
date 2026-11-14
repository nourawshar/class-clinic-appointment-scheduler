// server/src/routes/appointments.js
//
// Appointment CRUD + status change.
//
//   GET    /api/appointments?date=YYYY-MM-DD — grouped by doctor (role-scoped)
//   POST   /api/appointments                — coordinator + admin (conflict-checked)
//   PUT    /api/appointments/:id            — coordinator + admin (conflict-checked)
//   DELETE /api/appointments/:id            — coordinator + admin
//   PATCH  /api/appointments/:id/status     — coordinator + admin + doctor + assistant (no translator)
//
// Time zone handling: date and startTime are stored as plain strings
// (date = "YYYY-MM-DD", startTime = "HH:MM"), so overlap comparisons run in
// local wall-clock time and the conflict check is deterministic.

const express = require("express");
const prisma = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  auditCreate,
  auditUpdate,
  auditDelete,
  auditStatusChange,
} = require("../utils/audit");
const { isValidType, isValidStatus } = require("../utils/validate");

const router = new express.Router();

// ---- helpers ---------------------------------------------------------------

/** Overlap(a,b) = a.start < b.start+b.duration AND a.start+a.duration > b.start */
function overlaps(a, b) {
  const aStart = toMinutes(a.date, a.startTime);
  const aEnd = aStart + a.durationMinutes * 60000;
  const bStart = toMinutes(b.date, b.startTime);
  const bEnd = bStart + b.durationMinutes * 60000;
  return aStart < bEnd && aEnd > bStart;
}

function toMinutes(dateStr, startTime) {
  const [y, m, d] = String(dateStr || "").split("-").map(Number);
  const [hh, mm] = String(startTime || "").split(":").map(Number);
  if ([y, m, d, hh, mm].some((v) => Number.isNaN(v))) return NaN;
  if (hh > 23 || mm > 59) return NaN;
  return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
}

function toISO(dateStr, startTime) {
  const [y, m, d] = String(dateStr || "").split("-").map(Number);
  const [hh, mm] = String(startTime || "").split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0).toISOString();
}

/** Doctor group payload for GET /appointments. */
function doctorGroup(doctorId, appointments) {
  return prisma.doctor.findUnique({
    where: { id: doctorId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  }).then((doctor) => ({
    doctor,
    appointments,
  }));
}

/** Build the conflict-check "candidate" appointment object from a request body. */
function candidateAppointment(body) {
  return {
    date: body.date,
    startTime: body.startTime,
    durationMinutes: body.durationMinutes,
  };
}

// ---- GET /appointments ------------------------------------------------------

router.get("/appointments", requireAuth, async (req, res) => {
  const rawDate = req.query.date;
  if (!rawDate) {
    return res.status(400).json({ error: "date query param is required (YYYY-MM-DD)" });
  }
  const date = String(rawDate).trim();

  const me = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: { role: true, doctorId: true },
  });
  if (!me) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const isAdminOrCoordinator = me.role === "admin" || me.role === "coordinator";
  const isDoctorOrAssistant = me.role === "doctor" || me.role === "assistant";
  const isTranslator = me.role === "translator";

  if (!isAdminOrCoordinator && !isTranslator && !isDoctorOrAssistant) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Role scoping: doctor/assistant see only their own doctor's rows.
  let where = { date };
  if (isDoctorOrAssistant && me.doctorId) {
    where = { date, doctorId: me.doctorId };
  }

  let rows;
  try {
    rows = await prisma.appointment.findMany({
      where,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
  } catch (err) {
    console.error("GET /api/appointments error:", err);
    return res.status(500).json({ error: "Failed to list appointments" });
  }

  // Group by doctor (doctorId → { doctor, appointments }).
  const groups = [];
  const seen = new Set();
  for (const a of rows) {
    if (seen.has(a.doctorId)) continue;
    seen.add(a.doctorId);
    const group = await doctorGroup(a.doctorId, [a]);
    groups.push(group);
  }

  res.json({ appointments: groups });
});

// ---- POST /appointments -----------------------------------------------------

router.post("/appointments", requireRole("coordinator", "admin"), async (req, res) => {
  const {
    doctorId,
    patientName,
    date,
    startTime,
    durationMinutes,
    type,
    status,
    note,
  } = req.body || {};

  // ---- validation ---------------------------------------------------------
  if (!doctorId) return res.status(400).json({ error: "doctorId is required" });
  const doctor = await prisma.doctor.findUnique({
    where: { id: String(doctorId).trim() },
  });
  if (!doctor || !doctor.isActive) {
    return res.status(400).json({ error: "doctor is not found or inactive" });
  }

  if (!patientName || !String(patientName).trim()) {
    return res.status(400).json({ error: "patientName is required" });
  }
  const patient = await prisma.patient.findFirst({
    where: { name: String(patientName).trim() },
  });
  if (!patient) {
    return res.status(400).json({ error: "patient not found" });
  }

  if (!durationMinutes || Number(durationMinutes) <= 0) {
    return res.status(400).json({ error: "durationMinutes must be greater than 0" });
  }
  if (!isValidType(type)) return res.status(400).json({ error: "invalid type" });
  if (!isValidStatus(status)) return res.status(400).json({ error: "invalid status" });

  // ---- conflict check: same doctor + same date, overlapping times ---------
  const existing = await prisma.appointment.findMany({
    where: { doctorId: String(doctorId).trim(), date: String(date).trim() },
  });
  const candidate = candidateAppointment(req.body);
  for (const a of existing) {
    if (overlaps(a, candidate)) {
      return res.status(409).json({
        error: "time conflict with existing appointment",
        conflictingAppointmentId: a.id,
      });
    }
  }

  // ---- create -------------------------------------------------------------
  const appointment = await prisma.appointment.create({
    data: {
      doctorId: String(doctorId).trim(),
      patientName: String(patientName).trim(),
      date: String(date).trim(),
      startTime: String(startTime).trim(),
      durationMinutes: Number(durationMinutes),
      type,
      status: status || "pending",
      note: note || null,
    },
  });

  await auditCreate(req, "Appointment", appointment.id, {
    doctorId: appointment.doctorId,
    patientName: appointment.patientName,
    date: appointment.date,
    startTime: appointment.startTime,
    durationMinutes: appointment.durationMinutes,
    type: appointment.type,
    status: appointment.status,
    note: appointment.note,
  });

  res.status(201).json({ appointment });
});

// ---- PUT /api/appointments/:id ----------------------------------------------

router.put("/appointments/:id", requireRole("coordinator", "admin"), async (req, res) => {
  const { doctorId, patientName, date, startTime, durationMinutes, type, status, note } =
    req.body || {};

  const existing = await prisma.appointment.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    return res.status(404).json({ error: "Appointment not found" });
  }

  // ---- validation ---------------------------------------------------------
  const did = doctorId || existing.doctorId;
  const doctor = await prisma.doctor.findUnique({
    where: { id: String(did).trim() },
  });
  if (!doctor || !doctor.isActive) {
    return res.status(400).json({ error: "doctor is not found or inactive" });
  }

  if (patientName !== undefined) {
    if (!String(patientName).trim()) {
      return res.status(400).json({ error: "patientName is required" });
    }
    const patient = await prisma.patient.findFirst({
      where: { name: String(patientName).trim() },
    });
    if (!patient) {
      return res.status(400).json({ error: "patient not found" });
    }
  }

  if (durationMinutes !== undefined && Number(durationMinutes) <= 0) {
    return res.status(400).json({ error: "durationMinutes must be greater than 0" });
  }
  if (type !== undefined && !isValidType(type)) {
    return res.status(400).json({ error: "invalid type" });
  }
  if (status !== undefined && !isValidStatus(status)) {
    return res.status(400).json({ error: "invalid status" });
  }

  // ---- conflict check -------------------------------------------------------
  // Re-check conflicts for the same doctor/date, ignoring this appointment.
  if (date !== undefined || startTime !== undefined || durationMinutes !== undefined) {
    const search = {};
    if (date !== undefined) search.date = String(date).trim();
    if (startTime !== undefined) search.startTime = String(startTime).trim();
    if (durationMinutes !== undefined) search.durationMinutes = Number(durationMinutes);
    // overlap test with each existing appointment of the same doctor on that date
    const existing = await prisma.appointment.findMany({
      where: { doctorId: String(did).trim(), date: String(date || existing.date).trim() },
    });
    const candidate = candidateAppointment(req.body);
    for (const a of existing) {
      if (a.id === existing.id) continue; // this appointment
      if (overlaps(a, candidate)) {
        return res.status(409).json({
          error: "time conflict with existing appointment",
          conflictingAppointmentId: a.id,
        });
      }
    }
  }

  // ---- update ---------------------------------------------------------------
  const updateData = {};
  if (doctorId !== undefined) updateData.doctorId = String(doctorId).trim();
  if (patientName !== undefined) updateData.patientName = String(patientName).trim();
  if (date !== undefined) updateData.date = String(date).trim();
  if (startTime !== undefined) updateData.startTime = String(startTime).trim();
  if (durationMinutes !== undefined) updateData.durationMinutes = Number(durationMinutes);
  if (type !== undefined) updateData.type = type;
  if (status !== undefined) updateData.status = status;
  if (note !== undefined) updateData.note = note !== null && note !== undefined ? note : null;

  const updated = await prisma.appointment.update({
    where: { id: req.params.id },
    data: updateData,
  });

  // ---- audit ----------------------------------------------------------------
  const changes = {};
  if (existing.doctorId !== updated.doctorId) changes.doctorId = `${existing.doctorId}→${updated.doctorId}`;
  if (existing.patientName !== updated.patientName) changes.patientName = `${existing.patientName}→${updated.patientName}`;
  if (existing.date !== updated.date) changes.date = `${existing.date}→${updated.date}`;
  if (existing.startTime !== updated.startTime) changes.startTime = `${existing.startTime}→${updated.startTime}`;
  if (existing.durationMinutes !== updated.durationMinutes) changes.durationMinutes = `${existing.durationMinutes}→${updated.durationMinutes}`;
  if (existing.type !== updated.type) changes.type = `${existing.type}→${updated.type}`;
  if (existing.status !== updated.status) changes.status = `${existing.status}→${updated.status}`;
  if ((existing.note ?? null) !== (updated.note ?? null)) {
    changes.note = `${existing.note ?? ""}→${updated.note ?? ""}`;
  }
  if (Object.keys(changes).length > 0) {
    await auditUpdate(req, "Appointment", existing.id, changes);
  }

  res.json({ appointment: updated });
});

// ---- DELETE /api/appointments/:id -------------------------------------------

router.delete("/appointments/:id", requireRole("coordinator", "admin"), async (req, res) => {
  const existing = await prisma.appointment.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    return res.status(404).json({ error: "Appointment not found" });
  }

  await prisma.appointment.delete({
    where: { id: req.params.id },
  });

  await auditDelete(req, "Appointment", existing.id, { message: "deleted" });

  res.json({ ok: true });
});

// ---- PATCH /api/appointments/:id/status -------------------------------------

router.patch("/appointments/:id/status", requireRole("coordinator", "admin", "doctor", "assistant"), async (req, res) => {
  const { status } = req.body || {};
  if (!isValidStatus(status)) {
    return res.status(400).json({ error: "invalid status" });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: req.params.id },
  });
  if (!appointment) {
    return res.status(404).json({ error: "Appointment not found" });
  }

  // Doctor + assistant may only change appointments of their own doctor.
  const me = req.session.user;
  const isAdminOrCoordinator = me.role === "admin" || me.role === "coordinator";
  const isDoctorOrAssistant = me.role === "doctor" || me.role === "assistant";
  if (!isAdminOrCoordinator && isDoctorOrAssistant && me.doctorId && appointment.doctorId !== me.doctorId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const updated = await prisma.appointment.update({
    where: { id: req.params.id },
    data: { status },
  });

  await auditStatusChange(req, "Appointment", appointment.id, {
    status: `${appointment.status}→${updated.status}`,
  });

  res.json({ appointment: updated });
});

module.exports = router;
