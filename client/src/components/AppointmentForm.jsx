// Class Clinic — add / edit appointment form.
import { useState, useEffect } from "react";
import { t, locale } from "../i18n.js";
import { formatDateShort } from "../format.js";
import { TYPE_OPTIONS, STATUS_OPTIONS } from "../constants.js";
import { friendlyError } from "../error.js";
import { useToast } from "../toast.jsx";

const EMPTY_FORM = {
  doctorId: "",
  patientId: "",
  date: "",
  startTime: "09:00",
  duration: 30,
  type: "randevu",
  status: "confirmed",
  note: "",
};

function defaultsForAdd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return { ...EMPTY_FORM, date: `${y}-${m}-${day}` };
}

export default function AppointmentForm({
  mode,
  appointment,
  doctors,
  patients,
  onSave,
  onClose,
}) {
  const [form, setForm] = useState(() => {
    if (mode === "add") return defaultsForAdd();
    if (appointment) {
      return {
        doctorId: appointment.doctorId || "",
        patientId: appointment.patientId || "",
        date: appointment.date || "",
        startTime: appointment.startTime || "",
        duration: appointment.duration || 30,
        type: appointment.type || "randevu",
        status: appointment.status || "confirmed",
        note: appointment.note || "",
      };
    }
    return EMPTY_FORM;
  });
  const [errors, setErrors] = useState({});
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const { notify } = useToast();

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { delete prev[field]; return prev; });
  };

  // Auto-select first matching patient when typing
  useEffect(() => {
    if (patientQuery.trim()) {
      const match = patients.find((p) =>
        p.name.toLowerCase().includes(patientQuery.trim().toLowerCase())
      );
      if (match) set("patientId", match.id);
    } else {
      set("patientId", "");
    }
    setPatientResults(patients.filter(
      (p) => p.name && p.name.toLowerCase().includes(patientQuery.toLowerCase())
    ));
  }, [patientQuery, patients]);

  const validate = () => {
    const next = {};
    if (!form.doctorId) next.doctorId = t("requiredDoctor");
    if (!form.patientId) next.patientId = t("requiredPatient");
    if (!form.date) next.date = t("requiredDate");
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) next.date = t("invalidDate");
    if (!form.startTime) next.startTime = t("requiredStartTime");
    else if (!/^\d{1,2}:\d{2}$/.test(form.startTime)) next.startTime = t("invalidTime");
    const dur = parseInt(form.duration, 10);
    if (!form.duration) next.duration = t("requiredField");
    else if (!Number.isInteger(dur) || dur < 1) next.duration = t("invalidDuration");
    else if (dur > 480) next.duration = t("invalidDurationMax");
    return next;
  };

  const submit = (e) => {
    if (e) e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSave({ ...form });
  };



  const paste = (field, value) => {
    set(field, value);
  };

  return (
    <form className="appointment-form" onSubmit={submit} noValidate>
      <div className="row">
        <div className="field">
          <label htmlFor="f-doctor">{t("doctor")}</label>
          <select
            id="f-doctor"
            value={form.doctorId}
            onChange={(e) => set("doctorId", e.target.value)}
            disabled={mode === "view"}
          >
            <option value="">{t("doctorPlaceholder")}</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {errors.doctorId && <p className="field__error">{errors.doctorId}</p>}
        </div>

        <div className="field">
          <label htmlFor="f-date">{t("date")}</label>
          <input
            id="f-date"
            className="input"
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            disabled={mode === "view"}
          />
          {errors.date && <p className="field__error">{errors.date}</p>}
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="f-patient">{t("patient")}</label>
          <input
            id="f-patient"
            className="input"
            type="text"
            value={patientQuery}
            onChange={(e) => setPatientQuery(e.target.value)}
            placeholder={t("patientPlaceholder")}
            disabled={mode === "view"}
            list="patient-options"
          />
          <datalist id="patient-options">
            {patientResults.map((p) => (
              <option key={p.id} value={p.name} />
            ))}
          </datalist>
          {patientQuery && !patientResults.length && (
            <p className="field__error">{t("noData")}</p>
          )}
          {errors.patientId && <p className="field__error">{errors.patientId}</p>}

          {/* Searchable dropdown of existing patients. */}
          <ul className="patient-list">
            {patientResults.map((p) => (
              <li
                key={p.id}
                className="patient-list__item"
                onClick={() => {
                  paste("patientId", p.id);
                  setPatientQuery(p.name);
                }}
              >
                {p.name}
              </li>
            ))}
            {!patientQuery && <li className="patient-list__placeholder">{t("searchPlaceholder")}</li>}
            {patientQuery && !patientResults.length && (
              <li className="patient-list__empty">{t("noData")}</li>
            )}
          </ul>
        </div>

        <div className="field">
          <label htmlFor="f-start">{t("startTime")}</label>
          <input
            id="f-start"
            className="input"
            type="time"
            value={form.startTime}
            onChange={(e) => set("startTime", e.target.value)}
            disabled={mode === "view"}
          />
          {errors.startTime && <p className="field__error">{errors.startTime}</p>}
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="f-duration">{t("duration")}</label>
          <input
            id="f-duration"
            className="input"
            type="number"
            min={1}
            max={480}
            step={1}
            value={form.duration}
            onChange={(e) => set("duration", e.target.value)}
            disabled={mode === "view"}
          />
          {errors.duration && <p className="field__error">{errors.duration}</p>}
        </div>

        <div className="field">
          <label htmlFor="f-type">{t("type")}</label>
          <select
            id="f-type"
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
            disabled={mode === "view"}
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.key)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="f-status">{t("status")}</label>
          <select
            id="f-status"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            disabled={mode === "view"}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.key)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="f-note">{t("note")}</label>
          <textarea
            id="f-note"
            className="input"
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            placeholder={t("notePlaceholder")}
            rows={3}
            disabled={mode === "view"}
          />
        </div>
      </div>

      <div className="appointment-form__actions">
        {mode === "edit" && (
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t("cancel")}
          </button>
        )}
        <button type="submit" className="btn btn--primary">
          {mode === "add" ? t("addAppointment") : t("save")}
        </button>
      </div>
    </form>
  );
}
