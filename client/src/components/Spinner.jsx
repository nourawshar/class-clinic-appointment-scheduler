// Class Clinic — loading spinner (replaces content while fetching).
import { t } from "../i18n.js";

export default function Spinner({ className = "" }) {
  return (
    <div className={`spinner card ${className}`.trim()}>
      <span className="spinner__loop" aria-hidden="true"></span>
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}
