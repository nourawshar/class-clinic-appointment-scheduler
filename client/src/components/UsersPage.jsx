// Class Clinic — user management page (admin only).
import { useEffect, useState } from "react";
import { t } from "../i18n.js";
import { friendlyError } from "../error.js";
import { useToast } from "../toast.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import { ROLES } from "../constants.js";

export default function UsersPage({ backend, user, perms }) {
  const { notify } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { mode: "add"|"edit", user }
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    backend
      .getUsers()
      .then((data) => { if (!cancelled) setUsers(data); })
      .catch((err) => notify(friendlyError(err), "error"))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const openAdd = () => setModal({ mode: "add", user: null });
  const openEdit = (u) => setModal({ mode: "edit", user: u });
  const closeModal = () => setModal(null);

  const submitUser = async (payload) => {
    try {
      if (payload.id) await backend.updateUser(payload.id, payload);
      else await backend.createUser(payload);
      await refresh();
      closeModal();
      notify(t("usersSaved"), "success");
    } catch (err) {
      notify(friendlyError(err), "error");
    }
  };

  const refresh = async () => {
    const data = await backend.getUsers();
    setUsers(data);
  };

  const scheduleDelete = (u) => setConfirm({ id: u.id, name: u.name });

  if (!perms.canManageUsers) {
    return (
      <div className="card">
        <h2>{t("usersTitle")}</h2>
        <p className="form-error">{t("notAllowed")}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__head">
        <h2>{t("usersTitle")}</h2>
        <button className="btn btn--primary" onClick={openAdd}>{t("addUser")}</button>
      </div>

      {loading ? (
        <div className="card skeleton"><div className="skeleton__bar" /></div>
      ) : users.length === 0 ? (
        <div className="card empty-state">
          <span className="empty-state__icon" aria-hidden="true">👥</span>
          <h2>{t("usersListEmpty")}</h2>
          <button className="btn btn--primary" onClick={openAdd}>{t("addUser")}</button>
        </div>
      ) : (
        <ul className="user-list">
          {users.map((u) => (
            <li className="user-card" key={u.id}>
              <div className="user-card__body">
                <h3 className="user-card__name">
                  {u.name || u.username}
                  <span className="user-card__username">@{u.username}</span>
                </h3>
                <p className="user-card__email">{u.email || "—"}</p>
                <div className="user-card__meta">
                  <span className={`role-badge role-badge--${u.role}`}>{t(`role.${u.role}`)}</span>
                  <span className={`status-badge status-badge--${u.active ? "completed" : "cancelled"}`}>
                    {u.active ? t("activity") : t("blocked")}
                  </span>
                </div>
              </div>
              <div className="user-card__actions">
                <button className="btn btn--ghost btn--sm" onClick={() => openEdit(u)}>{t("editUser")}</button>
                <button className="btn btn--ghost btn--sm btn--danger-ghost" onClick={() => scheduleDelete(u)}>{t("delete")}</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modal && (
        <UserFormModal
          mode={modal.mode}
          user={modal.user}
          onSave={submitUser}
          onClose={closeModal}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={t("deleteConfirmTitle")}
          message={`${t("delete")} ${confirm.name}?`}
          confirmLabel={t("delete")}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            backend.deleteUser(confirm.id).then(refresh).catch((err) => {
              notify(friendlyError(err), "error");
            });
            setConfirm(null);
          }}
        />
      )}
    </div>
  );
}

function UserFormModal({ mode, user, onSave, onClose }) {
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || "assistant");
  const [active, setActive] = useState(user?.active ?? true);
  const [errors, setErrors] = useState({});

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!username.trim()) next.username = t("requiredField");
    else if (!/^[A-Za-z0-9_]{3,20}$/.test(username.trim())) next.username = "3–20 letters, digits or underscores.";
    if (mode === "add") {
      if (!password) next.password = t("requiredField");
      else if (password.length < 6) next.password = "Password must be at least 6 characters.";
      if (password !== confirm) next.confirm = "Passwords do not match.";
    }
    if (!name.trim()) next.name = t("requiredField");
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) next.email = "Enter a valid email.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave({
      id: user?.id || null,
      username: username.trim(),
      password: mode === "add" ? password : undefined,
      name: name.trim(),
      email: email.trim(),
      role,
      active,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--narrow" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>{mode === "add" ? t("addUser") : t("editUser")}</h2>
          <button className="modal__close" onClick={onClose} aria-label={t("close")}>✕</button>
        </div>
        <form className="appointment-form appointment-form--narrow" onSubmit={submit} noValidate>
          <div className="row">
            <div className="field">
              <label htmlFor="uf-username">{t("usernameField")}</label>
              <input id="uf-username" className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. doctor" />
              {errors.username && <p className="field__error">{errors.username}</p>}
            </div>
            <div className="field">
              <label htmlFor="uf-role">{t("roleField")}</label>
              <select id="uf-role" className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => <option key={r} value={r}>{t(`role.${r}`)}</option>)}
              </select>
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="uf-name">{t("nameFieldUser")}</label>
              <input id="uf-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} />
              {errors.name && <p className="field__error">{errors.name}</p>}
            </div>
            <div className="field">
              <label htmlFor="uf-email">{t("emailFieldUser")}</label>
              <input id="uf-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("emailPlaceholder")} />
              {errors.email && <p className="field__error">{errors.email}</p>}
            </div>
          </div>
          {mode === "add" && (
            <div className="row">
              <div className="field">
                <label htmlFor="uf-password">{t("passwordField")}</label>
                <input id="uf-password" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
                {errors.password && <p className="field__error">{errors.password}</p>}
              </div>
              <div className="field">
                <label htmlFor="uf-confirm">{t("confirmPasswordField")}</label>
                <input id="uf-confirm" className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" />
                {errors.confirm && <p className="field__error">{errors.confirm}</p>}
              </div>
            </div>
          )}
          <div className="field">
            <label className="switch">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              <span className="switch__track"></span>
              <span className="switch__label">{t("activeField")}</span>
            </label>
          </div>
          <div className="appointment-form__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>{t("cancel")}</button>
            <button type="submit" className="btn btn--primary">{t("save")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
