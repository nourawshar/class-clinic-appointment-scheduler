// server/src/routes/index.js
//
// Barrel file: re-exports every /api route module so the app wires them all
// in a single place (server/src/index.js).

module.exports = {
  auth: require("./auth"),
  doctors: require("./doctors"),
  patients: require("./patients"),
  appointments: require("./appointments"),
  audit: require("./audit"),
  health: require("./health"),
};
