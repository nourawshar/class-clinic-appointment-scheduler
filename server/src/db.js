// server/src/db.js
//
// Single Prisma client shared across the whole application.
// Prisma 6 keeps the client in @prisma/client, generated from
// server/prisma/schema.prisma via `npx prisma generate`.
//
// NOTE: no `new PrismaClient()` per request — one module-level instance is
// safe in a single-process Express app and avoids connection-pool exhaustion.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  // log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

module.exports = prisma;
