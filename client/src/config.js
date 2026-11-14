// Class Clinic — runtime configuration.
// Set VITE_API_URL to point at the real backend (e.g. http://localhost:4000/api).
// When unset (or "true"), the app runs in mock mode using an in-memory backend
// seeded from the repo, so the UI works out of the box.
export const API_BASE =
  (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const MOCK_MODE = import.meta.env.VITE_MOCK_MODE !== "false";
