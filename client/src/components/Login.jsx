// Class Clinic — login page (username + password -> POST /api/login).
import { useState } from "react";
import { t } from "../i18n.js";
import { login } from "../api.js";
import { friendlyError } from "../error.js";
import { useToast } from "../toast.jsx";
import Spinner from "./Spinner.jsx";

export default function Login({ onLogin }) {
  const { notify } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login({ username, password });
      // Persist session so the app can restore the user on reload.
      localStorage.setItem("clinic_session", JSON.stringify(res.user));
      localStorage.setItem("clinic_token", res.token || "");
      onLogin(res.user);
    } catch (err) {
      const msg = friendlyError(err);
      setError(msg);
      notify(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-scaler">
      <div className="card login-card">
        <div className="login-card__logo" aria-hidden="true"></div>
        <h1 className="login-card__title">{t("loginTitle")}</h1>
        <p className="login-card__subtitle">{t("loginSubtitle")}</p>

        {error && <p className="form-error" role="alert">{error}</p>}

        <form className="login-form" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="login-username">{t("username")}</label>
            <input
              id="login-username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("username")}
              autoComplete="username"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="field">
            <label htmlFor="login-password">{t("password")}</label>
            <input
              id="login-password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("password")}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <div className="login-form__actions">
            <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
              {loading ? <Spinner className="btn__spinner" /> : t("loginButton")}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--block"
              onClick={() => window.location.hash = "#/login"}
            >
              {t("goBack")}
            </button>
          </div>
        </form>

        <p className="login-card__foot">
          <button className="login-card__foot-link">{t("forgotPassword")}</button>
        </p>
      </div>
    </div>
  );
}
