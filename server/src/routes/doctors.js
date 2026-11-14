// server/src/routes/doctors.js
//
// GET  /api/doctors — list active doctors

const express = require("express");
const prisma = require("../db");

const router = new express.Router();

router.get("/doctors", async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
      },
    });
    res.json({ doctors });
  } catch (err) {
    console.error("GET /api/doctors error:", err);
    res.status(500).json({ error: "Failed to list doctors" });
  }
});

module.exports = router;
