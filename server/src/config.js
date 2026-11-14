// server/src/config.js
//
// Loads environment variables and exposes the PostgreSQL connection string.
// The DATABASE_URL is the only config the Prisma client needs.
//
// NOTE: .env is git-ignored so secrets (DATABASE_URL, SESSION_SECRET) never
// land in version control. See .env.example for the documented variables.

const path = require("path");
const { readFileSync } = require("fs");

// Resolve .env relative to this file (server/.env)
const dotenvPath = path.resolve(__dirname, "..", ".env");
let dotenvLoaded = false;
try {
  readFileSync(dotenvPath, "utf8"); // exists check only
  require("dotenv").config({ path: dotenvPath });
  dotenvLoaded = true;
} catch (err) {
  // No .env file present — fall back to system environment variables.
  // The app still starts; the health endpoint will report a missing DB URL.
}

function required(name) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const config = {
  hasDotenv: dotenvLoaded,
  databaseUrl: process.env.DATABASE_URL || required("DATABASE_URL"),
  sessionSecret: process.env.SESSION_SECRET || required("SESSION_SECRET"),
  port: Number(process.env.PORT || 4000),
};

module.exports = config;
