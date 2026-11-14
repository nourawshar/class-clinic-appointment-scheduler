// Class Clinic — detail panel for an appointment.
// Shows every field, an editable Status dropdown and Note, plus Save.
// Only rendered for roles allowed to edit (coordinator, admin, doctor, assistant).
import { useState } from "react";
import { t, locale } from "../i18n.js";
import { formatDateShort, statusLabel, patientDisplayName, typeLabel } from "../format.js";
import { STATUS_OPTIONS } from "../constants.js";
import { useToast } from "../toast.jsx";

export default function AppointmentDetailView({
  appointment,
  doctors,
  patients,
  onSave,
  onDelete,
  onClose,
}) {
  const { notify } = useToast();
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState(appointment ? appointment.status : "planned");
  const [note, setNote] = useState(appointment ? appointment.note : "");
  const doctor = appointment ? doctors.find((d) => d.id === appointment.doctorId) : null;
  const patient = appointment ? patients.find((p) => p.id === appointment.patientId) : null;

  const commit = () => {
    onSave({ id: appointment.id, status, note });
    setSaved(true);
    notify(t("savedMessage"), "success");
    setTimeout(() => onClose(), 1400);
  };

  if (!appointment) return null;

  return (
    <div className="appointment-detail">
      <div className="appointment-detail__row">
        <span className="appointment-detail__label">{t("doctor")}</span>
        <span className="appointment-detail__value">{doctor ? doctor.name : t("noData")}</span>
      </div>
      <div className="appointment-detail__row">
        <span className="appointment-detail__label">{t("patient")}</span>
        <span className="appointment-detail__value">{patientDisplayName(patient)}</span>
      </div>
      <div className="appointment-detail__row">
        <span className="appointment-detail__label">{t("date")}</span>
        <span className="appointment-detail__value">{formatDateShort(appointment.date, locale())}</span>
      </div>
      <div className="appointment-detail__row">
        <span className="appointment-detail__label">{t("startTime")}</span>
        <span className="appointment-detail__value">{appointment.startTime}</span>
      </div>
      <div className="appointment-detail__row">
        <span className="appointment-detail__label">{t("duration")}</span>
        <span className="appointment-detail__value">{appointment.duration} min</span>
      </div>
      <div className="appointment-detail__row">
        <span className="appointment-detail__label">{t("type")}</span>
        <span className="appointment-detail__value">{typeLabel(appointment.type)}</span>
      </div>

      <div className="appointment-detail__row">
        <span className="appointment-detail__label">{t("status")}</span>
        <select
          className="input input--small"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {t(o.key)}
            </option>
          ))}
        </select>
      </div>

      <div className="appointment-detail__row">
        <span className="appointment-detail__label">{t("note")}</span>
        <textarea
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
      </div>

      <div className="appointment-detail__actions">
        {onDelete && appointment.id && canEdit && (
          <button
            type="button"
            className="btn btn--ghost btn--danger"
            onClick={onDelete}
          >
            {t("delete")}
          </button>
        )}
        {canEdit ? (
          <button type="button" className="btn btn--primary" onClick={commit}>
            {saved ? t("close") : t("save")}
          </button>
        ) : (
          <button type="button" className="btn btn--ghost" disabled>
            {t("notAllowed")}
          </button>
        )}
      </div>
    </div>
  );
}
