// server/src/routes/patients.js
//
// Role-scoped patient CRUD (coordinator + admin only; 403 otherwise)
//   GET    /api/patients
//   POST   /api/patients
//   PUT    /api/patients/:id

const express = require("express");
const prisma = require("../db");
const { requireRole } = require("../middleware/auth");
const { auditCreate, auditUpdate } = require("../utils/audit");
const { sanitizeText } = require("../utils/validate");

const router = new express.Router();

/** Co-ordinator + admin only. */
function adminOnly() {
  return requireRole("coordinator", "admin");
}

router.get("/patients", adminOnly(), async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });
    res.json({ patients });
  } catch (err) {
    console.error("GET /api/patients error:", err);
    res.status(500).json({ error: "Failed to list patients" });
  }
});

router.post("/patients", adminOnly(), async (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "name is required" });
  }
  const patient = await prisma.patient.create({
    data: { name: sanitizeText(name) },
    select: { id: true, name: true, createdAt: true },
  });
  await auditCreate(req, "Patient", patient.id, { name: patient.name });
  res.status(201).json({ patient });
});

router.put("/patients/:id", adminOnly(), async (req, res) => {
  const { name } = req.body || {};
  const existing = await prisma.patient.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const nextName = name !== undefined ? String(name).trim() : existing.name;

  const updated = await prisma.patient.update({
    where: { id: req.params.id },
    data: { name: nextName },
    select: { id: true, name: true, createdAt: true },
  });

  const changes = {};
  if (existing.name !== nextName) {
    changes.name = `${existing.name}→${nextName}`;
  }
  if (Object.keys(changes).length === 0) {
    return res.json({ patient: updated });
  }
  await auditUpdate(req, "Patient", existing.id, changes);
  res.json({ patient: updated });
});

module.exports = router;
