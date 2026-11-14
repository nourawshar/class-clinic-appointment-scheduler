// Class Clinic — top bar (brand, date nav handled by DailyView, actions).
import { t } from "../i18n.js";
import { locales } from "../i18n.js";

function initials(user) {
  if (!user) return "";
  const parts = String(user.name || user.username || "").split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return String(user.username || "").slice(0, 2).toUpperCase();
}

export default function TopBar({ user, locale, onLocaleChange, onLogout }) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="topbar__brand">
          <span className="topbar__logo" aria-hidden="true"></span>
          <div className="topbar__title">
            <h1>{t("appName")}</h1>
            <p>{t("appTagline")}</p>
          </div>
        </div>

        <div className="topbar__actions">
          <div className="topbar__lang">
            <label htmlFor="lang-toggle">{t("language")}</label>
            <select
              id="lang-toggle"
              value={locale}
              onChange={(e) => onLocaleChange(e.target.value)}
            >
              {locales().map((l) => (
                <option key={l} value={l}>
                  {l === "en" ? "English" : "Türkçe"}
                </option>
              ))}
            </select>
          </div>

          <div className="topbar__user">
            <span className="topbar__avatar">{initials(user)}</span>
            <span className="topbar__uname">{user.username}</span>
            <button className="btn btn--ghost btn--sm" onClick={onLogout}>
              {t("logout")}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
