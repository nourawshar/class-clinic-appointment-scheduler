// server/src/middleware/auth.js
//
// Session-based authentication middleware.
//
// Express session magic is configured in src/index.js:
//   - memory store by default (single-process dev)
//   - SESSION_SECRET from .env / env
//
// req.session.user is populated on successful login and carries:
//   { id, username, role, firstName, lastName, doctorId, isActive }

/** Require an authenticated session. Sends 401 otherwise. */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

/**
 * Require role membership.
 *   requireRole("coordinator", "admin")  -> coordinator OR admin
 *   requireRole("doctor", "assistant")  -> doctor OR assistant (translator is excluded)
 *
 * Internals: requireAuth first, then role check. Sends 403 on failure.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      const user = req.session.user;
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      next();
    });
  };
}

module.exports = { requireAuth, requireRole };
