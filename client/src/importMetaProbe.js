// Probe: sets a global if import.meta.env is accessible in the page's modules.
window.__importMetaEnvUsed = true;
try {
  window.__importMetaEnv = import.meta.env.VITE_TEST_PLACEHOLDER;
} catch (e) {
  window.__importMetaEnvErr = String(e && e.message);
}
