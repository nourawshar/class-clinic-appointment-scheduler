// server/src/routes/users.js
// Role-scoped user CRUD (admin only).
//   GET    /api/users
//   POST   /api/users
//   PUT    /api/users/:id
//   DELETE /api/users/:id

const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../db");
const { requireRole } = require("../middleware/auth");

const router = new express.Router();

function adminOnly() {
  return requireRole("admin");
}

router.get("/users", adminOnly(), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    res.json({ users });
  } catch (err) {
    console.error("GET /api/users error:", err);
    res.status(500).json({ error: "Failed to list users" });
  }
});

router.post("/users", adminOnly(), async (req, res) => {
  try {
    const { username, password, firstName, lastName, role } = req.body || {};
    if (!username || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: "username, password, firstName, lastName, role are required" });
    }
    const existing = await prisma.user.findUnique({ where: { username: String(username).trim() } });
    if (existing) {
      return res.status(409).json({ error: "username already taken" });
    }
    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: {
        username: String(username).trim(),
        passwordHash,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        role: String(role),
        isActive: true,
      },
      select: {
        id: true, username: true, firstName: true, lastName: true,
        role: true, isActive: true, createdAt: true,
      },
    });
    res.status(201).json({ user });
  } catch (err) {
    console.error("POST /api/users error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.put("/users/:id", adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, isActive } = req.body || {};
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "user not found" });
    }
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = String(firstName).trim();
    if (lastName !== undefined) updateData.lastName = String(lastName).trim();
    if (role !== undefined) updateData.role = String(role);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, username: true, firstName: true, lastName: true,
        role: true, isActive: true, createdAt: true,
      },
    });
    res.json({ user });
  } catch (err) {
    console.error("PUT /api/users/:id error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/users/:id", adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "user not found" });
    }
    // Soft delete: set isActive to false instead of deleting
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/users/:id error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

module.exports = router;
