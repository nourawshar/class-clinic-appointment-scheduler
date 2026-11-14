// server/src/routes/health.js
//
// GET /api/health — postgres connect check (Prisma $connect)
// Returns the DB connection status so the platform/load balancer can probe it.

const express = require("express");
const prisma = require("../db");

const router = new express.Router();

router.get("/health", async (req, res) => {
  const started = Date.now();
  try {
    await prisma.$connect();
    res.json({
      status: "ok",
      database: "connected",
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
    });
  } catch (err) {
    res.json({
      status: "down",
      database: "disconnected",
      error: err.message || "unable to connect",
      durationMs: Date.now() - started,
    });
  }
});

module.exports = router;
