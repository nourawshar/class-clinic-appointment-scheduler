// Class Clinic — empty state (no data / no appointments for a date).
import { t } from "../i18n.js";

export default function EmptyState({ titleKey, subKey, actionLabel, onAction }) {
  return (
    <div className="empty-state card">
      <span className="empty-state__icon" aria-hidden="true">📭</span>
      <h2>{t(titleKey)}</h2>
      {subKey !== undefined && <p>{t(subKey)}</p>}
      {actionLabel && onAction && (
        <button className="btn btn--primary" onClick={onAction}>
          {t(actionLabel)}
        </button>
      )}
    </div>
  );
}
