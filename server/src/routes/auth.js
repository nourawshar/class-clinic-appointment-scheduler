// server/src/routes/auth.js
//
// POST /api/login  —  username + password → sets express-session; returns user
// GET  /api/me     —  the logged-in user (401 if not authenticated)

const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = new express.Router();

/** Hash a password with bcryptjs (10 rounds). */
function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

/** Verify a password against its bcrypt hash. */
function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/** Current user payload (excludes passwordHash). */
function currentUser(req) {
  return req.session.user
    ? {
        id: req.session.user.id,
        username: req.session.user.username,
        firstName: req.session.user.firstName,
        lastName: req.session.user.lastName,
        role: req.session.user.role,
        isActive: req.session.user.isActive,
        doctorId: req.session.user.doctorId,
      }
    : null;
}

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const user = await prisma.user.findUnique({
    where: { username: String(username).trim() },
  });

  if (!user || !user.isActive) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const ok = await comparePassword(String(password), user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  // Persist identity in the session (memory store for dev).
  req.session.regenerate((err) => {
    if (err) {
      console.error("session.regenerate error:", err);
      return res.status(500).json({ error: "Failed to establish session" });
    }
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      doctorId: user.doctorId,
    };
    res.json({ user: currentUser(req) });
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      doctorId: true,
    },
  });

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({ user });
});

module.exports = router;
