import { useMemo, useEffect, useState } from "react";
import { setLocale, t } from "./i18n.js";
import { ToastProvider } from "./toast.jsx";
import { PERMISSIONS } from "./constants.js";
import Login from "./components/Login.jsx";
import DailyView from "./components/DailyView.jsx";
import PatientsPage from "./components/PatientsPage.jsx";
import UsersPage from "./components/UsersPage.jsx";
import TopBar from "./components/TopBar.jsx";
import Spinner from "./components/Spinner.jsx";

export default function App() {
  window.__appStart = true;
  const [backend, setBackend] = useState(null);
  const [user, setUser] = useState(null);
  const [locale, setLocaleState] = useState(() => {
    const saved = localStorage.getItem("clinic_locale");
    return saved === "tr" ? "tr" : "en";
  });
  const [page, setPage] = useState("daily");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await import("./api.js");
        const api = await m.default;
        if (cancelled) return;
        setBackend(api);
        const saved = localStorage.getItem("clinic_session");
        if (saved) {
          try {
            setUser(JSON.parse(saved));
          } catch {
            /* malformed session */
          }
        }
      } catch (err) {
        if (!cancelled) setBackend(null);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setLocale(locale);
  }, [locale]);

  const perms = useMemo(() => ({
    canEditAppointment: PERMISSIONS.editAppointment(user?.role),
    canManagePatients: PERMISSIONS.managePatients(user?.role),
    canManageUsers: PERMISSIONS.manageUsers(user?.role),
  }), [user?.role]);

  if (busy) {
    return (
      <div className="screen-scaler">
        <div className="card">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!backend) {
    return (
      <div className="screen-scaler">
        <div className="card">
          <h2 className="error-title">{t("errorTitle")}</h2>
          <p>{t("errorServer")}</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login onLogin={setUser} />;

  const doctors = backend.listDoctors ? backend.listDoctors() : [];
  const patients = backend.listPatients ? backend.listPatients() : [];

  const links = [
    { key: "daily", label: t("pageDaily"), active: page === "daily", action: () => setPage("daily") },
  ];
  if (perms.canManagePatients) {
    links.push({ key: "patients", label: t("patients"), active: page === "patients", action: () => setPage("patients") });
  }
  if (perms.canManageUsers) {
    links.push({ key: "users", label: t("users"), active: page === "users", action: () => setPage("users") });
  }

  return (
    <ToastProvider>
      <div className="app">
        <TopBar
          user={user}
          locale={locale}
          onLocaleChange={setLocaleState}
          onLogout={() => setUser(null)}
        />

        <nav className="subnav">
          {links.map((l) => (
            <button
              key={l.key}
              className={`subnav__link${l.active ? " subnav__link--active" : ""}`}
              onClick={l.action}
            >
              {l.label}
            </button>
          ))}
        </nav>

        <main className="main">
          {page === "daily" && <DailyView backend={backend} user={user} perms={perms} doctors={doctors} patients={patients} />}
          {page === "patients" && <PatientsPage backend={backend} user={user} perms={perms} />}
          {page === "users" && <UsersPage backend={backend} user={user} perms={perms} />}
        </main>

        <footer className="app-footer">
          <span>{t("appName")}</span>
          <span>·</span>
          <span>{t("appTagline")}</span>
        </footer>
      </div>
    </ToastProvider>
  );
}
