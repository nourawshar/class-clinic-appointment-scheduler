// server/src/routes/audit.js
//
// GET /api/audit — audit log (coordinator + admin only; 403 otherwise)

const express = require("express");
const prisma = require("../db");
const { requireRole } = require("../middleware/auth");

const router = new express.Router();

router.get("/audit", requireRole("coordinator", "admin"), async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {},
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        userId: true,
        action: true,
        entityType: true,
        entityId: true,
        details: true,
        createdAt: true,
      },
    });
    res.json({ logs });
  } catch (err) {
    console.error("GET /api/audit error:", err);
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
});

module.exports = router;
