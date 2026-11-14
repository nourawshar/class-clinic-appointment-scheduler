// Class Clinic — lightweight toast notifications.
// Provides `useToast()` -> `notify(message, type)` for transient feedback on
// errors, saves, deletions and network issues.

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ToastContext = createContext(null);

const TYPES = {
  error: "error",
  success: "success",
  info: "info",
};

let toastIdCounter = 0;
/** Module-level queue of toasts that fired before the provider mounted. */
const pendingQueue = [];
/** Module-level timer for auto-dismiss. */
let autoTimer = null;

/**
 * Show a transient notification.
 * @param {string} message
 * @param {"success"|"error"|"info"} [type="info"]
 */
export function notify(message, type = "info") {
  const id = ++toastIdCounter;
  const entry = { id, message: String(message), type: TYPES[type] || "info" };
  pendingQueue.push(entry);

  // Restart the auto-dismiss ticker for the whole stack.
  clearTimeout(autoTimer);
  autoTimer = setTimeout(fire, 4000);
  return entry;
}

let firedIds = new Set();

function fire() {
  if (pendingQueue.length === 0) {
    firedIds.clear();
    return;
  }
  const next = pendingQueue.shift();
  if (firedIds.has(next.id)) {
    fire();
    return;
  }
  firedIds.add(next.id);
  // Push to the React queue so the viewport renders it.
  ReactQueue.push(next);
  autoTimer = setTimeout(fire, 4000);
}

// Buffer for toasts fired outside React. (Imported lazily to avoid circularity.)
let ReactQueue = [];
let queuedFlush = false;

function flushQueue() {
  if (queuedFlush) return;
  queuedFlush = true;
  requestAnimationFrame(() => {
    queuedFlush = false;
    if (ReactQueue.length === 0) return;
    const next = [...ReactQueue];
    ReactQueue = [];
    // Hand off to the provider's effect via a shared 'peek' channel.
    window.__appToastBatch = window.__appToastBatch || [];
    window.__appToastBatch.push(...next);
    if (window.__appToastBatch.length > 0) {
      // Trigger the provider's effect by dispatching a custom event.
      window.dispatchEvent(new CustomEvent("clinic-toast-flush"));
    }
  });
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const dismiss = useCallback((id) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Surface batched toasts delivered via the flush event.
  useEffect(() => {
    const onFlush = () => {
      const batch = window.__appToastBatch || [];
      window.__appToastBatch = [];
      setItems((prev) => [...prev, ...batch]);
    };
    window.addEventListener("clinic-toast-flush", onFlush);
    return () => window.removeEventListener("clinic-toast-flush", onFlush);
  }, []);

  // Re-sync any toasts still sitting in the module queue on mount/render.
  useEffect(() => {
    const snapshot = pendingQueue.slice();
    pendingQueue.length = 0;
    if (snapshot.length === 0) return;
    setItems((prev) => [...prev, ...snapshot]);
  }, []);

  return (
    <ToastContext.Provider value={{ notify, dismiss }}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

export { TYPES };

function ToastViewport({ items, onDismiss }) {
  if (items.length === 0) return null;
  return (
    <div className="toast-layer" role="region" aria-label="Notifications">
      {items.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.type}`}
          onClick={() => onDismiss(t.id)}
        >
          <span className="toast__icon" aria-hidden="true">
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "●"}
          </span>
          <span className="toast__message">{t.message}</span>
          <button
            className="toast__close"
            aria-label="Dismiss"
            onClick={() => onDismiss(t.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
