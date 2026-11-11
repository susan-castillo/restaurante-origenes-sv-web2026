
import { useEffect, useId } from "react";

export default function Modal({
  show = false,
  title,
  children,
  footer,
  onClose,
  size = "md",
}) {
  const titleId = useId();

  useEffect(() => {
    if (!show) return;

    function cerrarConEscape(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", cerrarConEscape);

    return () => {
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="app-modal-overlay">
      <div
        className={`modal-dialog modal-${size} app-modal-dialog`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id={titleId}>
              {title}
            </h5>

            <button
              type="button"
              className="btn-close"
              aria-label="Cerrar"
              onClick={onClose}
            />
          </div>

          <div className="modal-body">
            {children}
          </div>

          {footer && (
            <div className="modal-footer">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
