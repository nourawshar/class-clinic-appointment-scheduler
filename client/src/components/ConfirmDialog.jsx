// Class Clinic — lightweight confirmation dialog (delete / destructive actions).
import { t } from "../i18n.js";

export default function ConfirmDialog({ title, message, confirmLabel = t("delete"), onCancel, onConfirm }) {
  return (
    <div className="modal-overlay">
      <div className="modal modal--narrow">
        <div className="modal__head modal__head--center">
          <h2>{title}</h2>
          <button className="modal__close" onClick={onCancel} aria-label={t("close")}>✕</button>
        </div>
        <p className="modal__message">{message}</p>
        <div className="modal__actions">
          <button className="btn btn--ghost" onClick={onCancel}>{t("cancel")}</button>
          <button className="btn btn--danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
