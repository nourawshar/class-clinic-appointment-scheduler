// server/src/utils/audit.js
//
// Centralised audit logging.
//
// Every create / update / delete / statusChange writes an AuditLog row with:
//   userId, action, entityType, entityId, details, createdAt
//
// details carries the old→new values using an "→" separator, e.g.
//   {"patientName": "SM→ISMAIL MUHAMMAD"}
//   {"status": "confirmed→arrived"}
//
// Design notes:
//   - create : details = new field values ({ name: "..." })
//   - update : details = { field: "old→new" } per changed field
//   - delete : details = { message: "..." }
//   - statusChange : details = { status: "confirmed→arrived" }

const prisma = require("../db");

/** Build an AuditLog record and write it. */
async function audit({ userId, action, entityType, entityId, details = {} }) {
  return prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      details,
    },
  });
}

/** Normalise user identity for the audit trail (falls back to guest id). */
function userIdOf(req) {
  return req.session && req.session.userId ? String(req.session.userId) : "guest";
}

async function auditCreate(req, entityType, entityId, details) {
  await audit({ userId: userIdOf(req), action: "create", entityType, entityId, details });
}

async function auditUpdate(req, entityType, entityId, details) {
  await audit({ userId: userIdOf(req), action: "update", entityType, entityId, details });
}

async function auditDelete(req, entityType, entityId, details) {
  await audit({ userId: userIdOf(req), action: "delete", entityType, entityId, details });
}

async function auditStatusChange(req, entityType, entityId, details) {
  await audit({ userId: userIdOf(req), action: "statusChange", entityType, entityId, details });
}

module.exports = {
  audit,
  auditCreate,
  auditUpdate,
  auditDelete,
  auditStatusChange,
  userIdOf,
};
