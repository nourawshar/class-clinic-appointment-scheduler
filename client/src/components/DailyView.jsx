// Class Clinic — daily schedule view (top bar, date nav, per-doctor list).
import { useCallback, useEffect, useState } from "react";
import { t, locale } from "../i18n.js";
import { toISODate, addDays } from "../date.js";
import { formatDateShort, patientDisplayName, startTimeRange, typeLabel, statusLabel } from "../format.js";
import { friendlyError } from "../error.js";
import { useToast } from "../toast.jsx";
import Spinner from "./Spinner.jsx";
import AppointmentForm from "./AppointmentForm.jsx";
import AppointmentDetailView from "./AppointmentDetailView.jsx";
import EmptyState from "./EmptyState.jsx";

const TODAY = toISODate();

/** Group appointments by doctor and return groups with sorted items. */
function groupByDoctor(list, doctors) {
  const byId = new Map();
  for (const d of doctors) byId.set(d.id, d);

  // bucket by doctorId, preserving first-seen order
  const buckets = new Map();
  for (const apt of list) {
    if (!buckets.has(apt.doctorId)) buckets.set(apt.doctorId, []);
    buckets.get(apt.doctorId).push(apt);
  }

  const groups = [];
  for (const [doctorId, items] of buckets.entries()) {
    const doctor = byId.get(doctorId) || null;
    items.sort((a, b) =>
      a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0
    );
    groups.push({ doctor, items });
  }
  return groups;
}

export default function DailyView({ backend, user, perms, doctors, patients }) {
  const { notify } = useToast();
  const [date, setDate] = useState(TODAY);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [navError, setNavError] = useState("");
  const [modal, setModal] = useState(null); // { mode: "add" | "edit" | "view", appointment }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNavError("");
    backend.getAppointmentsForDate(date)
      .then((data) => { if (!cancelled) setList(data); })
      .catch((err) => { if (!cancelled) setNavError(friendlyError(err)); notify(friendlyError(err), "error"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [backend, date]);

  const openAdd = () => setModal({ mode: "add", appointment: null });
  const openView = (apt) => setModal({ mode: "view", appointment: apt });
  const closeModal = () => setModal(null);

  const saveAppointment = async (payload) => {
    try {
      if (payload.id) {
        await backend.updateAppointment(payload.id, {
          status: payload.status,
          note: payload.note,
        });
      } else {
        await backend.createAppointment(payload);
      }
      const data = await backend.getAppointmentsForDate(date);
      setList(data);
      if (modal?.mode === "view") closeModal();
      notify(t("saveSuccess"), "success");
    } catch (err) {
      notify(friendlyError(err), "error");
    }
  };

  const removeAppointment = async (id) => {
    try {
      await backend.deleteAppointment(id);
      const data = await backend.getAppointmentsForDate(date);
      setList(data);
      if (modal?.mode === "view") closeModal();
      notify(t("deleteConfirmTitle"), "success");
    } catch (err) {
      notify(friendlyError(err), "error");
    }
  };

  const groups = groupByDoctor(list, doctors || []);

  const jumpDay = (delta) => setDate((d) => addDays(d, delta));
  const goToday = () => setDate(TODAY);

  if (loading && list.length === 0 && navError === "") {
    return (
      <div className="daily-view">
        <div className="card skeleton"><div className="skeleton__bar" /></div>
        <div className="card skeleton"><div className="skeleton__bar" /></div>
      </div>
    );
  }

  return (
    <div className="daily-view">
      {/* Daily header: brand, date picker, prev/next, +Add. */}
      <div className="daily-header">
        <div className="daily-header__brand">
          <span className="daily-header__logo"></span>
          <div className="daily-header__info">
            <h2>{t("appName")}</h2>
            <p className="daily-header__date">{formatDateShort(date, locale())}</p>
          </div>
        </div>

        <div className="daily-header__nav">
          <button className="btn btn--ghost btn--sm" onClick={() => jumpDay(-1)}>{t("prevDay")}</button>

          <input
            className="input input--date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label={t("datePickerLabel")}
          />

          <button className="btn btn--ghost btn--sm" onClick={() => jumpDay(1)}>{t("nextDay")}</button>

          <button className="btn btn--primary" onClick={openAdd}>
            <span aria-hidden="true">+</span> {t("addAppointment")}
          </button>
        </div>
      </div>

      {/* Grouped per-doctor list. */}
      {groups.length === 0 ? (
        <div className="card">
          <EmptyState
            titleKey="noAppointments"
            subKey="noAppointmentsSub"
            actionLabel={t("addAppointmentShort")}
            onAction={openAdd}
          />
        </div>
      ) : (
        groups.map((g) => (
          <section className="doctor-card" key={g.doctor?.id ?? "nowhere"}>
            <div className="doctor-card__header">
              <div
                className="doctor-card__avatar"
                style={g.doctor ? { background: doctorAvatarBg(g.doctor) } : undefined}
              >
                {g.doctor ? g.doctor.name.split(" ").map((w) => w[0]).join("") : "?"}
              </div>
              <div className="doctor-card__body">
                <h3 className="doctor-card__name">{g.doctor?.name || t("noData")}</h3>
                <p className="doctor-card__specialty">{g.doctor?.specialty || "—"}</p>
              </div>
              <span className="doctor-card__count">{g.items.length}</span>
            </div>

            {g.items.length === 0 ? (
              <p className="doctor-card__empty">{t("noAppointments")}</p>
            ) : (
              <ul className="appointment-list">
                {g.items.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    doctor={g.doctor}
                    onOpen={() => openView(a)}
                    canEdit={perms?.canEditAppointment}
                  />
                ))}
              </ul>
            )}
          </section>
        ))
      )}

      {modal && (
        <AppointmentModal
          mode={modal.mode}
          appointment={modal.appointment}
          doctors={doctors}
          patients={patients}
          onSave={saveAppointment}
          onDelete={removeAppointment}
          onClose={closeModal}
          canEdit={perms?.canEditAppointment}
        />
      )}

      {navError && <p className="form-error" role="alert">{navError}</p>}
    </div>
  );
}

function doctorAvatarBg(doctor) {
  let h = 160;
  for (const ch of doctor.name) h = (h * 131 + ch.charCodeAt(0) * 7) % 360;
  return `hsl(${h}, 70%, 45%)`;
}

function AppointmentCard({ appointment, doctor, onOpen, canEdit }) {
  return (
    <li className="appointment-card" onClick={onOpen}>
      <div className="appointment-card__top">
        <span className="appointment-card__time">{startTimeRange(appointment)}</span>
        <span className={`type-badge type-badge--${appointment.type}`}>
          {typeLabel(appointment.type)}
        </span>
      </div>
      <div className="appointment-card__patient">
        <span className="appointment-card__patient-name">
          {patientDisplayName(appointment)}
        </span>
      </div>
      <div className="appointment-card__status">
        <span className={`status-badge status-badge--${appointment.status}`}>
          {statusLabel(appointment.status)}
        </span>
      </div>
    </li>
  );
}

// Modal wrapper: backdrop + close, contains form or detail view.
function AppointmentModal({
  mode,
  appointment,
  doctors,
  patients,
  onSave,
  onDelete,
  onClose,
  canEdit,
}) {
  const title = mode === "add"
    ? t("addAppointment")
    : mode === "edit"
      ? t("editAppointment")
      : t("close");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>{title}</h2>
          <button className="modal__close" onClick={onClose} aria-label={t("close")}>
            ✕
          </button>
        </div>

        {mode === "add" || mode === "edit" ? (
          <AppointmentForm
            mode={mode}
            appointment={appointment}
            doctors={doctors}
            patients={patients}
            onSave={onSave}
            onClose={onClose}
          />
        ) : (
          <AppointmentDetailView
            appointment={appointment}
            doctors={doctors}
            patients={patients}
            onSave={onSave}
            onDelete={onDelete}
            onClose={onClose}
            canEdit={canEdit}
          />
        )}

        <div className="modal__foot">
          {mode === "edit" && (
            <button className="btn btn--ghost" onClick={onClose}>
              {t("cancel")}
            </button>
          )}
          {mode === "view" && canEdit && (
            <button className="btn btn--primary" onClick={onClose}>
              {t("close")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
