// Class Clinic — patient management page (coordinator + admin).
import { useEffect, useState } from "react";
import { t } from "../i18n.js";
import { friendlyError } from "../error.js";
import { useToast } from "../toast.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

export default function PatientsPage({ backend, user, perms }) {
  const { notify } = useToast();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { mode: "add"|"edit", patient }
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    backend
      .getPatients()
      .then((data) => { if (!cancelled) setPatients(data); })
      .catch((err) => notify(friendlyError(err), "error"))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const openAdd = () => setModal({ mode: "add", patient: null });
  const openEdit = (p) => setModal({ mode: "edit", patient: p });
  const closeModal = () => setModal(null);

  const submitPatient = async (payload) => {
    try {
      if (payload.id) await backend.updatePatient(payload.id, payload);
      else await backend.createPatient(payload);
      await refresh();
      closeModal();
      notify(t("patientsSaved"), "success");
    } catch (err) {
      notify(friendlyError(err), "error");
    }
  };

  const refresh = async () => {
    const data = await backend.getPatients();
    setPatients(data);
  };

  const scheduleDelete = (p) => setConfirm({ id: p.id, name: p.name });

  if (!perms.canManagePatients) {
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
        <h2>{t("patientsTitle")}</h2>
        <button className="btn btn--primary" onClick={openAdd}>{t("addPatient")}</button>
      </div>

      {loading ? (
        <div className="card skeleton"><div className="skeleton__bar" /></div>
      ) : patients.length === 0 ? (
        <EmptyState
          titleKey="patientListEmpty"
          actionLabel={t("addPatient")}
          onAction={openAdd}
        />
      ) : (
        <ul className="patient-list">
          {patients.map((p) => (
            <li className="patient-card" key={p.id}>
              <div className="patient-card__body">
                <h3 className="patient-card__name">{p.name}</h3>
                <p className="patient-card__email">{p.email || "—"}</p>
                <p className="patient-card__phone">{p.phone || "—"}</p>
              </div>
              <div className="patient-card__actions">
                <button className="btn btn--ghost btn--sm" onClick={() => openEdit(p)}>{t("editPatient")}</button>
                <button className="btn btn--ghost btn--sm btn--danger-ghost" onClick={() => scheduleDelete(p)}>{t("delete")}</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modal && (
        <PatientFormModal
          mode={modal.mode}
          patient={modal.patient}
          onSave={submitPatient}
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
            backend.deletePatient(confirm.id).then(refresh).catch((err) => {
              notify(friendlyError(err), "error");
            });
            setConfirm(null);
          }}
        />
      )}
    </div>
  );
}

function PatientFormModal({ mode, patient, onSave, onClose }) {
  const [name, setName] = useState(patient?.name || "");
  const [email, setEmail] = useState(patient?.email || "");
  const [phone, setPhone] = useState(patient?.phone || "");
  const [errors, setErrors] = useState({});

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!name.trim()) next.name = t("requiredField");
    else if (!/^[A-Za-z\s'\-]+$/.test(name.trim())) next.name = "Name must be letters only.";
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) next.email = "Enter a valid email.";
    if (phone.trim() && !/^\+?[0-9][\d\s\-().]{6,19}$/.test(phone.trim())) next.phone = t("phoneError");
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave({ id: patient?.id || null, name: name.trim(), email: email.trim(), phone: phone.trim() });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--narrow" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>{mode === "add" ? t("addPatient") : t("editPatient")}</h2>
          <button className="modal__close" onClick={onClose} aria-label={t("close")}>✕</button>
        </div>
        <form className="appointment-form appointment-form--narrow" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="pf-name">{t("nameField")}</label>
            <input id="pf-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} />
            {errors.name && <p className="field__error">{errors.name}</p>}
          </div>
          <div className="field">
            <label htmlFor="pf-email">{t("emailField")}</label>
            <input id="pf-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("emailPlaceholder")} />
            {errors.email && <p className="field__error">{errors.email}</p>}
          </div>
          <div className="field">
            <label htmlFor="pf-phone">{t("phoneField")}</label>
            <input id="pf-phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("phonePlaceholder")} />
            {errors.phone && <p className="field__error">{errors.phone}</p>}
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

// Inline empty state for the patients page.
function EmptyState({ titleKey, actionLabel, onAction }) {
  return (
    <div className="empty-state card">
      <span className="empty-state__icon" aria-hidden="true">📭</span>
      <h2>{t(titleKey)}</h2>
      <button className="btn btn--primary" onClick={onAction}>{t(actionLabel)}</button>
    </div>
  );
}
